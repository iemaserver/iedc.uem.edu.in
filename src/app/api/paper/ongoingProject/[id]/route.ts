import prisma from "@/lib/prisma";
import { ProjectStatus, ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.string().uuid("Invalid project ID format");

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  projectLink: z.string().optional(),
  projectImage: z.string().optional(),
  projectType: z.string().optional(),
  projectTags: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
  facultyAdvisors: z.array(z.string()).optional(),
  reviewerId: z.string().uuid().optional(),
  reviewerComments: z.string().optional(),
  reviewerStatus: z.nativeEnum(ReviewerStatus).optional(),
});

// Schema for reviewer actions
const reviewerActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
  reviewerId: z.string().uuid(),
});

// ─────────────────────────────────────────────
// GET: Fetch single project by ID
// ─────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);
    
    const project = await prisma.onGoingProject.findUnique({
      where: { id },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("GET /api/paper/ongoingProject/[id] error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid project ID format" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Failed to fetch project" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Update single project by ID
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);
    const body = await req.json();

    // Check if this is a reviewer action
    const isReviewerAction = body.action && ['approve', 'reject'].includes(body.action);

    if (isReviewerAction) {
      // Handle reviewer approval/rejection
      const { action, comments, reviewerId } = reviewerActionSchema.parse(body);

      // Verify reviewer exists
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true },
      });

      if (!reviewer) {
        return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
      }

      // Update project with reviewer action
      const updatedProject = await prisma.onGoingProject.update({
        where: { id },
        data: {
          reviewerStatus: action === 'approve' ? ReviewerStatus.ACCEPTED : ReviewerStatus.REJECTED,
          reviewerComments: comments || null,
          reviewedAt: new Date(),
          reviewer: { connect: { id: reviewerId } },
        },
        include: {
          members: { select: { id: true, name: true, email: true } },
          facultyAdvisors: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ 
        message: `Project ${action}d by reviewer`, 
        project: updatedProject 
      });
    } else {
      // Handle regular project updates
      const validatedData = updateSchema.parse(body);

      const updateData: any = {};

      // Handle simple field updates
      if (validatedData.title) updateData.title = validatedData.title;
      if (validatedData.description) updateData.description = validatedData.description;
      if (validatedData.projectLink !== undefined) updateData.projectLink = validatedData.projectLink;
      if (validatedData.projectImage !== undefined) updateData.projectImage = validatedData.projectImage;
      if (validatedData.projectType) updateData.projectType = validatedData.projectType;
      if (validatedData.projectTags) updateData.projectTags = validatedData.projectTags;
      if (validatedData.reviewerComments !== undefined) updateData.reviewerComments = validatedData.reviewerComments;

      // Handle date updates
      if (validatedData.startDate) {
        updateData.startDate = new Date(validatedData.startDate);
      }
      if (validatedData.endDate) {
        updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
      }

      // Handle status updates
      if (validatedData.status) {
        updateData.status = validatedData.status;
      }
      if (validatedData.reviewerStatus) {
        updateData.reviewerStatus = validatedData.reviewerStatus;
        updateData.reviewedAt = new Date();
      }

      // Handle reviewer assignment
      if (validatedData.reviewerId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: validatedData.reviewerId },
          select: { id: true },
        });

        if (!reviewer) {
          return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
        }

        updateData.reviewer = { connect: { id: reviewer.id } };
      }

      // Handle members update
      if (validatedData.members) {
        const members = await prisma.user.findMany({
          where: { id: { in: validatedData.members } },
          select: { id: true },
        });

        if (members.length !== validatedData.members.length) {
          return NextResponse.json({ error: "One or more members not found" }, { status: 404 });
        }

        updateData.members = { set: members.map(m => ({ id: m.id })) };
      }

      // Handle faculty advisors update
      if (validatedData.facultyAdvisors) {
        const facultyAdvisors = await prisma.user.findMany({
          where: { id: { in: validatedData.facultyAdvisors } },
          select: { id: true },
        });

        if (facultyAdvisors.length !== validatedData.facultyAdvisors.length) {
          return NextResponse.json({ error: "One or more faculty advisors not found" }, { status: 404 });
        }

        updateData.facultyAdvisors = { set: facultyAdvisors.map(f => ({ id: f.id })) };
      }

      const updatedProject = await prisma.onGoingProject.update({
        where: { id },
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
    }
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject/[id] error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to update project" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE: Delete single project by ID
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);

    // Check if project exists
    const existingProject = await prisma.onGoingProject.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete the project
    const deletedProject = await prisma.onGoingProject.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Project deleted successfully",
      project: deletedProject 
    });
  } catch (error: any) {
    console.error("DELETE /api/paper/ongoingProject/[id] error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid project ID format" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Failed to delete project" 
    }, { status: 500 });
  }
}
