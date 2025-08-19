import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { OngoingProjectStatus } from "@prisma/client";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const updateOngoingProjectSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  abstract: z.string().optional(),
  startDate: z.string().datetime().transform(str => new Date(str)).optional(),
  endDate: z.string().datetime().transform(str => new Date(str)).optional(),
  status: z.nativeEnum(OngoingProjectStatus).optional(),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),
  filepath: z.string().optional(),
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const project = await prisma.ongoingProject.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(project);

  } catch (error) {
    console.error("Error fetching ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await request.json();
    const validatedData = updateOngoingProjectSchema.parse(body);
    
    const { facultyAdvisorIds, memberIds, ...updateData } = validatedData;

    const existingProject = await prisma.ongoingProject.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    const updatedProject = await prisma.$transaction(async (tx:any) => {
      // Update basic project data
      const project = await tx.ongoingProject.update({
        where: { id: params.id },
        data: updateData,
      });

      // Update faculty advisors if provided
      if (facultyAdvisorIds !== undefined) {
        await tx.ongoingProject.update({
          where: { id: params.id },
          data: {
            facultyAdvisors: {
              set: [], // Clear existing
              connect: facultyAdvisorIds.map(id => ({ id })),
            },
          },
        });
      }

      // Update members if provided
      if (memberIds !== undefined) {
        await tx.ongoingProject.update({
          where: { id: params.id },
          data: {
            members: {
              set: [], // Clear existing
              connect: memberIds.map(id => ({ id })),
            },
          },
        });
      }

      return tx.ongoingProject.findUnique({
        where: { id: params.id },
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
    });

    return NextResponse.json(updatedProject);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error updating ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const existingProject = await prisma.ongoingProject.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    await prisma.ongoingProject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Ongoing project deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
