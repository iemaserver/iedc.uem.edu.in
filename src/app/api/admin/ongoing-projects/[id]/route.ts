import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  hasAccess,
  ApiErrors,
} from "@/utils/apiAuth";
import { ongoingProjectSchema } from "@/utils/validation";
import prisma from "@/lib/prisma";
import { OngoingProjectStatus, UserType } from "@prisma/client";

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

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const project = await prisma.ongoingProject.findUnique({
      where: { id },
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
        message: "Ongoing project not found"
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

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ongoingProjectSchema.partial().parse(body);

    // Check if project exists
    const existingProject = await prisma.ongoingProject.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    // Update project with transaction for relationships
    const updatedProject = await prisma.$transaction(async (tx) => {
      // Update basic project data
      const project = await tx.ongoingProject.update({
        where: { id },
        data: {
          title: validatedData.title,
          abstract: validatedData.abstract,
          keywords: validatedData.keywords,
          image: validatedData.image,
          filepath: validatedData.filepath,
          status: validatedData.status,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
        },
      });

      // Update faculty advisors if provided
      if (validatedData.facultyAdvisorIds) {
        await tx.ongoingProject.update({
          where: { id },
          data: {
            facultyAdvisors: {
              set: validatedData.facultyAdvisorIds.map(advisorId => ({ id: advisorId })),
            },
          },
        });
      }

      // Update members if provided
      if (validatedData.memberIds) {
        await tx.ongoingProject.update({
          where: { id },
          data: {
            members: {
              set: validatedData.memberIds.map(memberId => ({ id: memberId })),
            },
          },
        });
      }

      return project;
    });

    // Fetch updated project with relations
    const finalProject = await prisma.ongoingProject.findUnique({
      where: { id },
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
      data: finalProject,
    });

  } catch (error) {
    console.error("Error updating ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    // Check if project exists
    const existingProject = await prisma.ongoingProject.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    // Delete the project
    await prisma.ongoingProject.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ongoing project deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
