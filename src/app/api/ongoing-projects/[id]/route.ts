// app/api/ongoing-projects/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma"; // Assuming your Prisma client is exported from here

// Zod schema for updating an ongoing project (all fields optional for partial updates)
const updateOngoingProjectSchema = z.object({
  title: z.string().optional(),
  abstract: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  keywords: z.array(z.string()).optional(), // Keywords as String[]
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

// =======================================================
// API ENDPOINTS
// =======================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const project = await prisma.ongoingProject.findUnique({
      where: { id },
      include: {
        student: { select: { user: { select: { fullName: true, email: true } } } },
        facultyAdvisors: { select: { fullName: true, id: true } },
        members: { select: { fullName: true, id: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Ongoing project not found" }, { status: 404 });
    }

    return NextResponse.json(project);

  } catch (error) {
    console.error("Error fetching ongoing project:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const parsedData = updateOngoingProjectSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({
        message: "Invalid input for update",
        errors: parsedData.error.format(),
      }, { status: 400 });
    }

    const { keywords, facultyAdvisorIds, memberIds, ...projectData } = parsedData.data;

    const updatedProject = await prisma.ongoingProject.update({
      where: { id },
      data: {
        ...projectData,
        // Update keywords array directly
        keywords: keywords || undefined,
        facultyAdvisors: facultyAdvisorIds ? {
          set: facultyAdvisorIds.map(advisorId => ({ id: advisorId })),
        } : undefined,
        members: memberIds ? {
          set: memberIds.map(memberId => ({ id: memberId })),
        } : undefined,
      },
    });

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error("Error updating ongoing project:", error);
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.ongoingProject.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Ongoing project deleted successfully" }, { status: 204 });

  } catch (error) {
    console.error("Error deleting ongoing project:", error);
  
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}