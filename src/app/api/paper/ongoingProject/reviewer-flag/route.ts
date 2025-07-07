import prisma from "@/lib/prisma";
import { ReviewerStatus, ProjectStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for reviewer flag
const reviewerFlagSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
  flag: z.enum(['ACCEPT_FOR_PUBLICATION', 'REJECT_FOR_PUBLICATION'], {
    errorMap: () => ({ message: "Flag must be 'ACCEPT_FOR_PUBLICATION' or 'REJECT_FOR_PUBLICATION'" })
  }),
  comments: z.string().min(1, "Comments are required"),
  feedbackForStudent: z.string().optional(),
});

// Schema for requesting updates
const requestUpdateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
  updateRequest: z.string().min(1, "Update request message is required"),
  deadline: z.string().optional(),
});

// ─────────────────────────────────────────────
// POST: Reviewer flags project for publication decision
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId, flag, comments, feedbackForStudent } = reviewerFlagSchema.parse(body);

    // Verify reviewer
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId, userType: "FACULTY" },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    // Verify project and reviewer assignment
    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId, reviewerId: reviewerId },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ 
        error: "Project not found or you are not assigned as reviewer" 
      }, { status: 404 });
    }

    // Update project with reviewer flag
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewerStatus: flag === 'ACCEPT_FOR_PUBLICATION' ? ReviewerStatus.ACCEPTED : ReviewerStatus.REJECTED,
        reviewedAt: new Date(),
        reviewerComments: comments,
        // Store reviewer comments and feedback in a structured way
        // You might want to add these fields to your schema
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: `Project ${flag.toLowerCase().replace('_', ' ')} successfully`,
      project: updatedProject,
      reviewerAction: {
        flag,
        comments,
        feedbackForStudent,
        reviewerId,
        reviewerName: reviewer.name,
        reviewedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject/reviewer-flag error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to flag project" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Reviewer requests updates from student
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId, updateRequest, deadline } = requestUpdateSchema.parse(body);

    // Verify reviewer
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId, userType: "FACULTY" },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    // Verify project and reviewer assignment
    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId, reviewerId: reviewerId },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ 
        error: "Project not found or you are not assigned as reviewer" 
      }, { status: 404 });
    }

    // Update project status to indicate updates are requested
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewerStatus: ReviewerStatus.NEEDS_UPDATES,
        needsUpdate: true,
        updateRequest,
        updateDeadline: deadline ? new Date(deadline) : null,
        reviewedAt: new Date(),
        // Clear previous student response
        studentUpdateComments: null,
        studentUpdatedAt: null,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Update request sent to student successfully",
      project: updatedProject,
      updateRequest: {
        message: updateRequest,
        deadline,
        requestedBy: reviewer.name,
        requestedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject/reviewer-flag error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to request updates" 
    }, { status: 500 });
  }
}
