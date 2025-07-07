import prisma from "@/lib/prisma";
import { ProjectStatus, ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for admin actions
const adminActionSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  action: z.enum(['accept', 'reject', 'publish'], { 
    errorMap: () => ({ message: "Action must be 'accept', 'reject', or 'publish'" })
  }),
  comments: z.string().optional(),
  adminId: z.string().uuid("Invalid admin ID"),
});

const bulkStatusUpdateSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, "At least one project ID is required"),
  status: z.nativeEnum(ProjectStatus),
  adminId: z.string().uuid("Invalid admin ID"),
});

// ─────────────────────────────────────────────
// POST: Admin actions (accept/reject/publish projects after reviewer approval)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, action, comments, adminId } = adminActionSchema.parse(body);

    // Verify the project exists
    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId },
      include: {
        reviewer: { select: { id: true, name: true } },
        members: { select: { id: true, name: true } },
        facultyAdvisors: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify the admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, userType: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check if user is admin
    if (admin.userType !== 'ADMIN') {
      return NextResponse.json({ 
        error: "Only admins can perform this action" 
      }, { status: 403 });
    }

    let newStatus: ProjectStatus;
    let updateData: any = {};

    switch (action) {
      case 'accept':
        // Admin accepts the project (can be done regardless of reviewer status)
        newStatus = ProjectStatus.ONGOING;
        updateData = {
          status: newStatus,
          // Add admin comments if provided
        };
        break;

      case 'reject':
        // Admin rejects the project
        newStatus = ProjectStatus.CANCELLED;
        updateData = {
          status: newStatus,
        };
        break;

      case 'publish':
        // Admin publishes the project (usually after completion)
        // Check if project has been reviewed and approved
        if (project.reviewerStatus !== ReviewerStatus.ACCEPTED) {
          return NextResponse.json({ 
            error: "Project must be approved by reviewer before publishing" 
          }, { status: 400 });
        }
        newStatus = ProjectStatus.PUBLISH;
        updateData = {
          status: newStatus,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update the project
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: updateData,
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: `Project ${action}ed successfully`,
      project: updatedProject,
      adminAction: {
        action,
        adminId,
        adminName: admin.name,
        comments,
        actionAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject/admin error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to process admin action" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Bulk status update by admin
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectIds, status, adminId } = bulkStatusUpdateSchema.parse(body);

    // Verify the admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, userType: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check if user is admin
    if (admin.userType !== 'ADMIN') {
      return NextResponse.json({ 
        error: "Only admins can perform bulk updates" 
      }, { status: 403 });
    }

    // If status is PUBLISH, check if all projects are reviewer-approved
    if (status === ProjectStatus.PUBLISH) {
      const projects = await prisma.onGoingProject.findMany({
        where: { 
          id: { in: projectIds },
          reviewerStatus: { not: ReviewerStatus.ACCEPTED }
        },
        select: { id: true, title: true, reviewerStatus: true },
      });

      if (projects.length > 0) {
        return NextResponse.json({ 
          error: "Some projects are not approved by reviewer",
          unapprovedProjects: projects 
        }, { status: 400 });
      }
    }

    // Perform bulk update
    const result = await prisma.onGoingProject.updateMany({
      where: { id: { in: projectIds } },
      data: { status },
    });

    return NextResponse.json({
      message: `Updated ${result.count} project(s) to ${status}`,
      updatedCount: result.count,
      newStatus: status,
      adminAction: {
        adminId,
        adminName: admin.name,
        actionAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject/admin error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to perform bulk update" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// GET: Get projects with specific filters for admin dashboard
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const reviewerStatus = url.searchParams.get('reviewerStatus');
    const needsReview = url.searchParams.get('needsReview');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;
    const where: any = {};

    // Filter by project status
    if (status) {
      const statusSchema = z.nativeEnum(ProjectStatus);
      where.status = statusSchema.parse(status);
    }

    // Filter by reviewer status
    if (reviewerStatus) {
      const reviewerStatusSchema = z.nativeEnum(ReviewerStatus);
      where.reviewerStatus = reviewerStatusSchema.parse(reviewerStatus);
    }

    // Filter projects that need review (no reviewer assigned or pending review)
    if (needsReview === 'true') {
      where.OR = [
        { reviewerId: null },
        { reviewerStatus: ReviewerStatus.PENDING }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.onGoingProject.findMany({
        where,
        skip,
        take: limit,
        include: {
          members: { select: { id: true, name: true, email: true } },
          facultyAdvisors: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
        orderBy: [
          { reviewerStatus: 'asc' }, // Pending reviews first
          { createdAt: 'desc' }
        ],
      }),
      prisma.onGoingProject.count({ where }),
    ]);

    // Get summary statistics
    const stats = await prisma.onGoingProject.groupBy({
      by: ['status', 'reviewerStatus'],
      _count: true,
    });

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      statistics: stats,
      filters: {
        status,
        reviewerStatus,
        needsReview,
      },
    });
  } catch (error: any) {
    console.error("GET /api/paper/ongoingProject/admin error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid parameters", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to fetch admin projects" 
    }, { status: 500 });
  }
}
