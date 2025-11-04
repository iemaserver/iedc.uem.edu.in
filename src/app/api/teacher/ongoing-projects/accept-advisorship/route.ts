import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { OngoingProjectStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const acceptAdvisorshipSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
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
    const { projectId } = acceptAdvisorshipSchema.parse(body);

    // Check if project exists and is not already assigned to this teacher
    const project = await prisma.ongoingProject.findUnique({
      where: { id: projectId },
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

    if (!project) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    // Check if teacher is already a faculty advisor
    const isAlreadyAdvisor = project.facultyAdvisors.some(advisor => advisor.id === user.id);
    if (isAlreadyAdvisor) {
      return NextResponse.json({
        message: "You are already a faculty advisor for this project"
      }, { status: 400 });
    }

    // Add teacher as faculty advisor and potentially change status
    const updatedProject = await prisma.ongoingProject.update({
      where: { id: projectId },
      data: {
        facultyAdvisors: {
          connect: { id: user.id },
        },
        // Only change status if it's currently ONGOING
        ...(project.status === OngoingProjectStatus.ONGOING && {
          status: OngoingProjectStatus.ONGOING // Keep as ONGOING but now with advisor
        }),
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
      data: updatedProject,
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