import prisma from "@/lib/prisma";
import { ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for reviewer actions
const reviewerActionSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
  action: z.enum(['approve', 'reject'], { 
    errorMap: () => ({ message: "Action must be either 'approve' or 'reject'" })
  }),
  comments: z.string().optional(),
});

const reviewerAssignmentSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
});

// ─────────────────────────────────────────────
// POST: Reviewer actions (approve/reject projects)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId, action, comments } = reviewerActionSchema.parse(body);

    // Verify the project exists
    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify the reviewer exists and is authorized
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, name: true, userType: true },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    // Check if the reviewer is the assigned reviewer for this project
    if (project.reviewerId && project.reviewerId !== reviewerId) {
      return NextResponse.json({ 
        error: "You are not the assigned reviewer for this project" 
      }, { status: 403 });
    }

    // Determine the new status based on action
    const newReviewerStatus = action === 'approve' 
      ? ReviewerStatus.ACCEPTED 
      : ReviewerStatus.REJECTED;

    // Update the project with reviewer's decision
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewerStatus: newReviewerStatus,
        reviewerComments: comments || null,
        reviewedAt: new Date(),
        // Assign reviewer if not already assigned
        reviewer: project.reviewerId ? undefined : { connect: { id: reviewerId } },
      },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: `Project ${action}d successfully`,
      project: updatedProject,
      reviewerAction: {
        action,
        reviewerId,
        reviewerName: reviewer.name,
        comments,
        reviewedAt: updatedProject.reviewedAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject/reviewer error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to process reviewer action" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Assign reviewer to project
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId } = reviewerAssignmentSchema.parse(body);

    // Verify the project exists
    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify the reviewer exists and has appropriate user type
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, name: true, userType: true },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    // Check if user is faculty or admin (can be reviewer)
    if (!['FACULTY', 'ADMIN'].includes(reviewer.userType)) {
      return NextResponse.json({ 
        error: "Only faculty members and admins can be assigned as reviewers" 
      }, { status: 400 });
    }

    // Assign the reviewer to the project
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewer: { connect: { id: reviewerId } },
        reviewerStatus: ReviewerStatus.PENDING, // Reset to pending when new reviewer assigned
        reviewerComments: null,
        reviewedAt: null,
      },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Reviewer assigned successfully",
      project: updatedProject,
      assignment: {
        reviewerId,
        reviewerName: reviewer.name,
        assignedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject/reviewer error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to assign reviewer" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// GET: Get projects assigned to a specific reviewer
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const reviewerId = url.searchParams.get('reviewerId');
    const status = url.searchParams.get('status');

    if (!reviewerId) {
      return NextResponse.json({ error: "Reviewer ID is required" }, { status: 400 });
    }

    // Validate reviewer ID format
    const reviewerIdSchema = z.string().uuid();
    const validatedReviewerId = reviewerIdSchema.parse(reviewerId);

    // Build where clause
    const where: any = {
      reviewerId: validatedReviewerId,
    };

    if (status) {
      const statusSchema = z.nativeEnum(ReviewerStatus);
      const validatedStatus = statusSchema.parse(status);
      where.reviewerStatus = validatedStatus;
    }

    const projects = await prisma.onGoingProject.findMany({
      where,
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      projects,
      count: projects.length,
      reviewerId: validatedReviewerId,
      status: status || 'all',
    });
  } catch (error: any) {
    console.error("GET /api/paper/ongoingProject/reviewer error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid parameters", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to fetch reviewer projects" 
    }, { status: 500 });
  }
}
