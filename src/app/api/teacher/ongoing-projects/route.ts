import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { OngoingProjectStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const getOngoingProjectsQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  title: z.string().optional(),
  
  status: z.nativeEnum(OngoingProjectStatus).optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getOngoingProjectsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, status } = parsedQuery.data;
    const session  = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userRole = session.userType;
    const teacherId = session.teacherProfile?.id;
    // Verify this is a teacher route and user has permission
    if (userRole !== "TEACHER") {
      return NextResponse.json({
        message: "Forbidden: Teacher access required"
      }, { status: 403 });
    }

    // Verify the teacher exists and belongs to the requesting user
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true }
    });

    if (!teacher) {
      return NextResponse.json({
        message: "Teacher profile not found"
      }, { status: 404 });
    }

    // Build where clause - ONLY show projects where this teacher is a faculty advisor
    const whereClause: any = {
      facultyAdvisors: {
        some: {
          id: teacherId, // Only projects where this teacher is a faculty advisor
        },
      },
    };
    
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (status) whereClause.status = status;

    const projects = await prisma.ongoingProject.findMany({
      skip: (page - 1) * limit,
      take: limit,
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

    return NextResponse.json({
      data: projects,
      meta: {
        totalItems: totalProjects,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalProjects / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}