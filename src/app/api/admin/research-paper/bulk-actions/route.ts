import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, OngoingProjectStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors, hasAccess } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  status: z.nativeEnum(ResearchPaperStatus),
  comment: z.string().optional(),
});

const assignAdvisorSchema = z.object({
  paperIds: z.array(z.string()).min(1, "At least one paper ID is required"),
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

    // Update all papers
    const updatedPapers = await prisma.$transaction(async (tx) => {
      const papers = await tx.researchPaper.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          status,
        },
      });

      return papers;
    });

    return NextResponse.json({
      message: `Successfully updated ${updatedPapers.count} research papers`,
      data: { updated: updatedPapers.count },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error bulk updating research papers:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

// =======================================================
// ASSIGN ADVISORS TO PAPERS
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
    const { paperIds, advisorIds } = assignAdvisorSchema.parse(body);

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

    // Assign advisors to papers
    const results = await prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        paperIds.map(async (paperId) => {
          return tx.researchPaper.update({
            where: { id: paperId },
            data: {
              facultyAdvisors: {
                connect: advisorIds.map(id => ({ id })),
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
            },
          });
        })
      );

      return updates;
    });

    return NextResponse.json({
      message: `Successfully assigned advisors to ${results.length} papers`,
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