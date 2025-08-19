import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import z from "zod";
import { 
  getAuthenticatedUser, 
  hasAccess, 
  ApiErrors, 
  getPaginationParams, 
  createPaginatedResponse 
} from "@/utils/apiAuth";

const userSearchSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userType: z.nativeEnum(UserType).optional(),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = userSearchSchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = "1", limit = "10", userType, search } = parsedQuery.data;
    const pagination = getPaginationParams(page, limit);

    // Build where clause
    const whereClause: any = {};
    
    if (userType) {
      whereClause.userType = userType;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users with profiles
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          userType: true,
          image: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: {
            select: {
              id: true,
              rollNumber: true,
              section: true,
              year: true,
              batch: true,
              department: true,
            }
          },
          teacherProfile: {
            select: {
              id: true,
              affiliation: true,
              designation: true,
              subjectOfInterest: true,
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json(createPaginatedResponse(users, totalUsers, pagination));

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

const ZodUpdateSchema = z.object({
    id: z.string().uuid(),
    fullName: z.string().min(2).max(100).optional(),
    userType: z.nativeEnum(UserType).optional(),
});

export async function PATCH(request: NextRequest) {
    try {
        // Check authentication and admin authorization
        const userSession = await getAuthenticatedUser();
        if (!userSession) {
          return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
        }

        if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
        }

        const parsed = ZodUpdateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
        }

        const { id, ...data } = parsed.data;

        // Validate input
        if (!id || !data) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id },
            data,
        });

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}