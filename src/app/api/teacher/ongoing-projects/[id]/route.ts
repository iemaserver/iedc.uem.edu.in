import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  ApiErrors,
} from "@/utils/apiAuth";
import { ongoingProjectSchema } from "@/utils/validation";
import prisma from "@/lib/prisma";
import { OngoingProjectStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (userSession.userType !== "TEACHER") {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findFirst({
      where: { userId: userSession.id },
    });

    if (!teacher) {
      return NextResponse.json({
        message: "Teacher profile not found"
      }, { status: 404 });
    }

    const project = await prisma.ongoingProject.findFirst({
      where: {
        id,
        facultyAdvisors: {
          some: {
            id: teacher.id, // Only projects where this teacher is a faculty advisor
          },
        },
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

    if (!project) {
      return NextResponse.json({
        message: "Ongoing project not found or access denied"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Ongoing project retrieved successfully",
      data: project,
    });

  } catch (error) {
    console.error("Error fetching ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (userSession.userType !== "TEACHER") {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findFirst({
      where: { userId: userSession.id },
    });

    if (!teacher) {
      return NextResponse.json({
        message: "Teacher profile not found"
      }, { status: 404 });
    }

    const body = await request.json();
    
    // Verify this teacher is a faculty advisor for this project
    const existingProject = await prisma.ongoingProject.findFirst({
      where: {
        id,
        facultyAdvisors: {
          some: {
            id: teacher.id,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({
        message: "Ongoing project not found or access denied"
      }, { status: 404 });
    }

    // Teachers can primarily update status and add comments
    const allowedUpdates = {
      status: body.status as OngoingProjectStatus,
      // Teachers might also update other fields if needed
      ...(body.title && { title: body.title }),
      ...(body.abstract && { abstract: body.abstract }),
      ...(body.keywords && { keywords: body.keywords }),
    };

    const updatedProject = await prisma.ongoingProject.update({
      where: { id },
      data: allowedUpdates,
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
      message: "Ongoing project updated successfully",
      data: updatedProject,
    });

  } catch (error) {
    console.error("Error updating ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
