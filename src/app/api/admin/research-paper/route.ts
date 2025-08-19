import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, hasAccess, ApiErrors, getPaginationParams, createPaginatedResponse } from "@/utils/apiAuth";
import { UserType, ResearchPaperStatus, ProjectType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for DELETE request body
const deleteSchema = z.object({
  ids: z.array(z.string()),
});

const getResearchPapersQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  title: z.string().optional(),
  status: z.nativeEnum(ResearchPaperStatus).optional(),
  projectType: z.nativeEnum(ProjectType).optional(),
  studentId: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can access this endpoint
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = getResearchPapersQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, status, projectType, studentId, search } = parsedQuery.data;
    const pagination = getPaginationParams(page.toString(), limit.toString());

    // Build where clause for filtering - admins can see all papers
    const whereClause: any = {};
    
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

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch research papers with all related data
    const researchPapers = await prisma.researchPaper.findMany({
      skip: pagination.skip,
      take: pagination.limit,
      where: whereClause,
      include: {
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await prisma.researchPaper.count({ where: whereClause });

    return NextResponse.json(createPaginatedResponse(researchPapers, totalCount, pagination));

  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can delete research papers
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = deleteSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ 
        message: "Invalid request body", 
        errors: parsedBody.error.format() 
      }, { status: 400 });
    }

    const { ids } = parsedBody.data;

    // Delete the research papers
    const deleteResult = await prisma.researchPaper.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} research paper(s)`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error("Error deleting research papers:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}
