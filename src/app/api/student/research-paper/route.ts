import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, ProjectType, UserType } from "@prisma/client";
import { 
  getAuthenticatedUser, 
  canStudentAccess, 
  ApiErrors, 
  getPaginationParams, 
  createPaginatedResponse 
} from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const createResearchPaperSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  studentId: z.string().min(1, "Student ID is required"),
  status: z.nativeEnum(ResearchPaperStatus).default(ResearchPaperStatus.UPLOADED),
  image: z.string().optional(),
  fileUrl: z.string().optional(),
  projectType: z.nativeEnum(ProjectType).default(ProjectType.PERSONAL),
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

const getResearchPapersQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  title: z.string().optional(),
  status: z.nativeEnum(ResearchPaperStatus).optional(),
  projectType: z.nativeEnum(ProjectType).optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }
    console.log("User session is usertype is ", userSession.userType);

    if (userSession.userType !== UserType.STUDENT) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    if (!userSession.studentProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Remove studentId from validation and use the authenticated user's student ID
    const { studentId, ...bodyWithoutStudentId } = body;
    const validatedData = createResearchPaperSchema.parse({
      ...bodyWithoutStudentId,
      studentId: userSession.studentProfile.id
    });
    
    const { facultyAdvisorIds, memberIds, ...paperData } = validatedData;

    const newPaper = await prisma.$transaction(async (tx) => {
      const paper = await tx.researchPaper.create({
        data: paperData,
      });

      // Connect members
      if (memberIds && memberIds.length > 0) {
        await tx.researchPaper.update({
          where: { id: paper.id },
          data: {
            members: {
              connect: memberIds.map((id: string) => ({ id })),
            },
          },
        });
      }

      // Connect faculty advisors
      if (facultyAdvisorIds && facultyAdvisorIds.length > 0) {
        await tx.researchPaper.update({
          where: { id: paper.id },
          data: {
            facultyAdvisors: {
              connect: facultyAdvisorIds.map((id: string) => ({ id })),
            },
          },
        });
      }

      return tx.researchPaper.findUnique({
        where: { id: paper.id },
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
          members: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
    });

    return NextResponse.json(newPaper, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error creating research paper:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (userSession.userType !== UserType.STUDENT) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    if (!userSession.studentProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = getResearchPapersQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, status, projectType } = parsedQuery.data;
    const pagination = getPaginationParams(page.toString(), limit.toString());

    // Build WHERE clause - only for the authenticated student
    const whereClause: any = {
      studentId: userSession.studentProfile.id
    };

    if (title) {
      whereClause.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (projectType) {
      whereClause.projectType = projectType;
    }

    const papers = await prisma.researchPaper.findMany({
      skip: pagination.skip,
      take: pagination.limit,
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    const totalPapers = await prisma.researchPaper.count({
      where: whereClause,
    });

    return NextResponse.json(createPaginatedResponse(papers, totalPapers, pagination));

  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (userSession.userType !== UserType.STUDENT) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    if (!userSession.studentProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        message: "Invalid or empty array of IDs provided."
      }, { status: 400 });
    }

    // Ensure student can only delete their own papers
    const result = await prisma.researchPaper.deleteMany({
      where: {
        id: {
          in: ids,
        },
        studentId: userSession.studentProfile.id, // Security: only delete own papers
      },
    });

    return NextResponse.json({
      message: `${result.count} research papers deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting research papers:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}
