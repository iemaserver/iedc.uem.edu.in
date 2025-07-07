import prisma from "@/lib/prisma";
import { ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for reviewer assignment
const assignReviewerSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
  adminId: z.string().uuid("Invalid admin ID"),
});

const reassignReviewerSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  newReviewerId: z.string().uuid("Invalid new reviewer ID"),
  adminId: z.string().uuid("Invalid admin ID"),
  reason: z.string().optional(),
});

// ─────────────────────────────────────────────
// POST: Assign reviewer to project
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, reviewerId, adminId } = assignReviewerSchema.parse(body);

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId, userType: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify reviewer
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId, userType: "FACULTY" },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    // Update project with reviewer
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewer: { connect: { id: reviewerId } },
        reviewerStatus: ReviewerStatus.PENDING,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Reviewer assigned successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject/reviewer-assignment error:", error);
    
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
// PUT: Reassign reviewer to project
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, newReviewerId, adminId, reason } = reassignReviewerSchema.parse(body);

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId, userType: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify new reviewer
    const newReviewer = await prisma.user.findUnique({
      where: { id: newReviewerId, userType: "FACULTY" },
    });

    if (!newReviewer) {
      return NextResponse.json({ error: "New reviewer not found" }, { status: 404 });
    }

    // Update project with new reviewer
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: projectId },
      data: {
        reviewer: { connect: { id: newReviewerId } },
        reviewerStatus: ReviewerStatus.PENDING,
        reviewedAt: null, // Reset review timestamp
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Reviewer reassigned successfully",
      project: updatedProject,
      reason,
    });
  } catch (error: any) {
    console.error("PUT /api/paper/ongoingProject/reviewer-assignment error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to reassign reviewer" 
    }, { status: 500 });
  }
}
