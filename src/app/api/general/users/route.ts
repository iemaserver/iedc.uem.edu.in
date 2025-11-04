import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const getUsersQuerySchema = z.object({
  userType: z.nativeEnum(UserType).optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = getUsersQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { userType, search, limit = 50 } = parsedQuery.data;

    // Build where clause
    const whereClause: any = {
      isVerified: true, // Only verified users
    };

    if (userType) {
      whereClause.userType = userType;
    }

    if (search) {
      whereClause.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        userType: true,
        studentProfile: {
          select: {
            department: true,
            year: true,
            section: true,
            rollNumber: true,
          },
        },
        teacherProfile: {
          select: {
            designation: true,
            affiliation: true,
          },
        },
      },
      take: limit,
      orderBy: {
        fullName: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}