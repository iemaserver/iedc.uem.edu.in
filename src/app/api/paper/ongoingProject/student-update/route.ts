import prisma from "@/lib/prisma";
import { ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod Schema for student update request
const studentUpdateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  studentUpdateComments: z.string().min(1, "Update comments are required"),
  projectLink: z.string().url().optional().or(z.literal("")),
  projectImage: z.string().optional(),
  description: z.string().optional(),
});

// ─────────────────────────────────────────────
// POST: Student submits an update for their project
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = studentUpdateSchema.parse(body);

    // Check if project exists and needs updates
    const project = await prisma.onGoingProject.findUnique({
      where: { id: validatedData.projectId },
      include: {
        members: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.needsUpdate) {
      return NextResponse.json({ 
        error: "This project doesn't require updates" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      studentUpdateComments: validatedData.studentUpdateComments,
      studentUpdatedAt: new Date(),
      needsUpdate: false, // Reset the flag once student submits update
      reviewerStatus: ReviewerStatus.PENDING, // Reset to pending for reviewer to re-review
    };

    // Update optional fields if provided
    if (validatedData.projectLink !== undefined) {
      updateData.projectLink = validatedData.projectLink || null;
    }

    if (validatedData.projectImage !== undefined) {
      updateData.projectImage = validatedData.projectImage || null;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    // Update the project
    const updatedProject = await prisma.onGoingProject.update({
      where: { id: validatedData.projectId },
      data: updateData,
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Project update submitted successfully",
      project: updatedProject,
    }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/paper/ongoingProject/student-update error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to submit project update" 
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// GET: Get project details for student update
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await prisma.onGoingProject.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/paper/ongoingProject/student-update error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch project details" 
    }, { status: 500 });
  }
}
