import prisma from "@/lib/prisma";
import { ProjectStatus, ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ─────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────
const searchQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  status: z.nativeEnum(ProjectStatus).optional(),
  reviewerStatus: z.nativeEnum(ReviewerStatus).optional(),
});

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  projectLink: z.string().url().optional().nullable(),
  projectImage: z.string().optional().nullable(),
  projectType: z.string().optional().nullable(),
  projectTags: z.array(z.string()).default([]),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.UPLOAD),
  members: z.array(z.string().uuid()).min(1, "At least one member is required"),
  facultyAdvisors: z.array(z.string().uuid()).min(1, "At least one faculty advisor is required"),
  reviewerId: z.string().uuid().optional().nullable(),
});

const deleteSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, "At least one project ID is required"),
});

// ─────────────────────────────────────────────
// GET: Fetch multiple projects with search + pagination
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { query, page, limit, status, reviewerStatus } = searchQuerySchema.parse(searchParams);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { projectType: { contains: query, mode: "insensitive" } },
        { projectTags: { has: query } },
        { id: { contains: query, mode: "insensitive" } },
        { members: { some: { name: { contains: query, mode: "insensitive" } } } },
        { facultyAdvisors: { some: { name: { contains: query, mode: "insensitive" } } } },
        { reviewer: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (reviewerStatus) {
      where.reviewerStatus = reviewerStatus;
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.onGoingProject.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/paper/ongoingProject error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// POST: Create a new ongoing project
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const validatedData = createProjectSchema.parse(body);
    const { title, description, startDate, endDate, status, projectLink, projectImage, projectType, projectTags, members, facultyAdvisors, reviewerId } = validatedData;

    // Use transaction to ensure data consistency
    const project = await prisma.$transaction(async (prisma) => {
      // Validate members exist
      const ismembers = await prisma.user.findMany({
        where: { id: { in: members } },
        select: { id: true },
      });

      if (ismembers.length !== members.length) {
        throw new Error("One or more members not found");
      }

      // Validate faculty advisors exist
      const isfacultyAdvisors = await prisma.user.findMany({
        where: { id: { in: facultyAdvisors } },
        select: { id: true },
      });

      if (isfacultyAdvisors.length !== facultyAdvisors.length) {
        throw new Error("One or more faculty advisors not found");
      }

      // Validate reviewer if provided
      let reviewerData = null;
      if (reviewerId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: reviewerId },
          select: { id: true },
        });

        if (!reviewer) {
          throw new Error("Reviewer not found");
        }
        reviewerData = reviewer;
      }

      // Create the project
      return await prisma.onGoingProject.create({
        data: {
          title: title,
          description: description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: status || ProjectStatus.UPLOAD,
          projectLink: projectLink || null,
          projectImage: projectImage || null,
          projectType: projectType,
          projectTags: projectTags,
          members: {
            connect: members.map((memberId: string) => ({ id: memberId })),
          },
          facultyAdvisors: {
            connect: facultyAdvisors.map((facultyId: string) => ({ id: facultyId })),
          },
          reviewer: reviewerData ? { connect: { id: reviewerData.id } } : undefined,
          reviewerStatus: ReviewerStatus.PENDING,
        },
        include: {
          members: { select: { id: true, name: true, email: true } },
          facultyAdvisors: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ 
      message: "Project created successfully", 
      project 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to create project" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Mass update projects (assign reviewer/status)
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId, status, reviewerStatus } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!reviewerId && !status && !reviewerStatus) {
      return NextResponse.json({ 
        error: "At least one field to update is required" 
      }, { status: 400 });
    }

    const updateData: any = {};

    // Handle reviewer assignment
    if (reviewerId) {
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true },
      });

      if (!reviewer) {
        return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
      }

      updateData.reviewer = { connect: { id: reviewer.id } };
    }

    // Handle status updates
    if (status) {
      const validStatuses = Object.values(ProjectStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (reviewerStatus) {
      const validReviewerStatuses = Object.values(ReviewerStatus);
      if (!validReviewerStatuses.includes(reviewerStatus)) {
        return NextResponse.json({ error: "Invalid reviewer status value" }, { status: 400 });
      }
      updateData.reviewerStatus = reviewerStatus;
      updateData.reviewedAt = new Date();
    }

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
      message: "Project updated successfully", 
      project: updatedProject 
    });
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update project" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE: Bulk delete projects
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectIds } = deleteSchema.parse(body);

    const result = await prisma.onGoingProject.deleteMany({
      where: { id: { in: projectIds } },
    });

    return NextResponse.json({ 
      message: `Deleted ${result.count} project(s)`,
      count: result.count 
    });
  } catch (error: any) {
    console.error("DELETE /api/paper/ongoingProject error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to delete projects" 
    }, { status: 500 });
  }
}
