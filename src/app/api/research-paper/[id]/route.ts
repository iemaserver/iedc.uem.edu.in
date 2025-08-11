// app/api/research-papers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma";

const updateResearchPaperSchema = z.object({
  title: z.string().optional(),
  abstract: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  keywords: z.array(z.string()).optional(),
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const paper = await prisma.researchPaper.findUnique({
      where: { id },
      include: {
        student: { select: { user: { select: { fullName: true, email: true } } } },
        facultyAdvisors: { select: { fullName: true, id: true } },
        members: { select: { fullName: true, id: true } },
      },
    });

    if (!paper) {
      return NextResponse.json({ message: "Research paper not found" }, { status: 404 });
    }

    return NextResponse.json(paper);

  } catch (error) {
    console.error("Error fetching research paper:", error);
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
    const parsedData = updateResearchPaperSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input for update", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }
    
    const { keywords, facultyAdvisorIds, memberIds, ...paperData } = parsedData.data;

    // The update operation is now much simpler.
    // We can update the keywords array directly.
    const updatedPaper = await prisma.researchPaper.update({
      where: { id },
      data: {
        ...paperData,
        // Correctly handle keywords as an array field
        keywords: keywords || undefined, 
        facultyAdvisors: facultyAdvisorIds ? {
          set: facultyAdvisorIds.map(advisorId => ({ id: advisorId })),
        } : undefined,
        members: memberIds ? {
          set: memberIds.map(memberId => ({ id: memberId })),
        } : undefined,
      },
    });

    return NextResponse.json(updatedPaper);

  } catch (error) {
    console.error("Error updating research paper:", error);
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.researchPaper.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Research paper deleted successfully" }, { status: 204 });

  } catch (error) {
    console.error("Error deleting research paper:", error);
  
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}