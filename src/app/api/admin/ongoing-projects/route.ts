import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, hasAccess, ApiErrors, getPaginationParams, createPaginatedResponse } from "@/utils/apiAuth";
import { UserType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for DELETE request body
const deleteSchema = z.object({
  ids: z.array(z.string()),
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
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const pagination = getPaginationParams(page, limit);

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch ongoing projects with student details
    const ongoingProjects = await prisma.ongoingProject.findMany({
      skip: pagination.skip,
      take: pagination.limit,
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            department: true,
            year: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                userType: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await prisma.ongoingProject.count({ where: whereClause });

    return NextResponse.json(createPaginatedResponse(ongoingProjects, totalCount, pagination));

  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can delete ongoing projects
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

    // Delete the ongoing projects
    const deleteResult = await prisma.ongoingProject.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} ongoing project(s)`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error("Error deleting ongoing projects:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}
