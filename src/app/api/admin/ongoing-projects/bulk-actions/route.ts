import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { OngoingProjectStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors, hasAccess } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  status: z.nativeEnum(OngoingProjectStatus),
  comment: z.string().optional(),
});

const assignAdvisorSchema = z.object({
  projectIds: z.array(z.string()).min(1, "At least one project ID is required"),
  advisorIds: z.array(z.string()).min(1, "At least one advisor ID is required"),
});

// =======================================================
// BULK STATUS UPDATE
// =======================================================

export async function PATCH(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const { ids, status, comment } = bulkUpdateSchema.parse(body);

    // Update all projects
    const updatedProjects = await prisma.$transaction(async (tx) => {
      const projects = await tx.ongoingProject.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          status,
        },
      });

      return projects;
    });

    return NextResponse.json({
      message: `Successfully updated ${updatedProjects.count} ongoing projects`,
      data: { updated: updatedProjects.count },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error bulk updating ongoing projects:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

// =======================================================
// ASSIGN ADVISORS TO PROJECTS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const { projectIds, advisorIds } = assignAdvisorSchema.parse(body);

    // Verify all advisors are teachers
    const advisors = await prisma.user.findMany({
      where: {
        id: {
          in: advisorIds,
        },
        userType: UserType.TEACHER,
      },
    });

    if (advisors.length !== advisorIds.length) {
      return NextResponse.json({
        message: "Some advisor IDs are invalid or not teachers"
      }, { status: 400 });
    }

    // Assign advisors to projects
    const results = await prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        projectIds.map(async (projectId) => {
          return tx.ongoingProject.update({
            where: { id: projectId },
            data: {
              facultyAdvisors: {
                connect: advisorIds.map(id => ({ id })),
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
            },
          });
        })
      );

      return updates;
    });

    return NextResponse.json({
      message: `Successfully assigned advisors to ${results.length} projects`,
      data: results,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error assigning advisors:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}