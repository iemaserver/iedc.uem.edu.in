import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const acceptAdvisorshipSchema = z.object({
  paperId: z.string().min(1, "Paper ID is required"),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (user.userType !== UserType.TEACHER) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const { paperId } = acceptAdvisorshipSchema.parse(body);

    // Check if paper exists and is not already assigned to this teacher
    const paper = await prisma.researchPaper.findUnique({
      where: { id: paperId },
      include: {
        facultyAdvisors: true,
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({
        message: "Research paper not found"
      }, { status: 404 });
    }

    // Check if teacher is already a faculty advisor
    const isAlreadyAdvisor = paper.facultyAdvisors.some(advisor => advisor.id === user.id);
    if (isAlreadyAdvisor) {
      return NextResponse.json({
        message: "You are already a faculty advisor for this paper"
      }, { status: 400 });
    }

    // Add teacher as faculty advisor
    const updatedPaper = await prisma.researchPaper.update({
      where: { id: paperId },
      data: {
        facultyAdvisors: {
          connect: { id: user.id },
        },
        status: ResearchPaperStatus.UNDER_REVIEW,
      },
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        facultyAdvisors: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Successfully accepted as faculty advisor",
      data: updatedPaper,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error accepting advisorship:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}