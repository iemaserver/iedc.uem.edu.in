import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { OngoingProjectStatus, UserType } from "@prisma/client";
import { 
  getAuthenticatedUser, 
  ApiErrors, 
  getPaginationParams, 
  createPaginatedResponse 
} from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const createOngoingProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  studentId: z.string().min(1, "Student ID is required"),
  startDate: z.string().datetime().transform(str => new Date(str)).optional(),
  endDate: z.string().datetime().transform(str => new Date(str)).optional(),
  status: z.nativeEnum(OngoingProjectStatus).default(OngoingProjectStatus.ONGOING),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),
  filepath: z.string().optional(),
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

const getOngoingProjectsQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  title: z.string().optional(),
  status: z.nativeEnum(OngoingProjectStatus).optional(),
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

    if (userSession.userType !== UserType.STUDENT) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    if (!userSession.studentProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Remove studentId from validation and use the authenticated user's student ID
    const { studentId, ...bodyWithoutStudentId } = body;
    const validatedData = createOngoingProjectSchema.parse({
      ...bodyWithoutStudentId,
      studentId: userSession.studentProfile.id
    });
    
    const { facultyAdvisorIds, memberIds, ...projectData } = validatedData;

    const newProject = await prisma.$transaction(async (tx:any) => {
      const project = await tx.ongoingProject.create({
        data: projectData,
      });

      // Connect faculty advisors
      if (facultyAdvisorIds && facultyAdvisorIds.length > 0) {
        await tx.ongoingProject.update({
          where: { id: project.id },
          data: {
            facultyAdvisors: {
              connect: facultyAdvisorIds.map(id => ({ id })),
            },
          },
        });
      }

      // Connect members
      if (memberIds && memberIds.length > 0) {
        await tx.ongoingProject.update({
          where: { id: project.id },
          data: {
            members: {
              connect: memberIds.map(id => ({ id })),
            },
          },
        });
      }

      return tx.ongoingProject.findUnique({
        where: { id: project.id },
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

    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error creating ongoing project:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
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
    const parsedQuery = getOngoingProjectsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, status } = parsedQuery.data;
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

    const projects = await prisma.ongoingProject.findMany({
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
      orderBy: { startDate: 'desc' },
    });

    const totalProjects = await prisma.ongoingProject.count({ where: whereClause });

    return NextResponse.json(createPaginatedResponse(projects, totalProjects, pagination));

  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        message: "Invalid or empty array of IDs provided."
      }, { status: 400 });
    }

    const result = await prisma.ongoingProject.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} ongoing projects deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting ongoing projects:", error);
    return NextResponse.json({
      message: "Internal server error."
    }, { status: 500 });
  }
}
