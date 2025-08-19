// app/api/general/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UserType } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { 
  getAuthenticatedUser, 
  hasAccess, 
  ApiErrors, 
  getPaginationParams, 
  createPaginatedResponse 
} from "@/utils/apiAuth";



// Zod schema for request query parameters
const userQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  userType: z.enum([UserType.STUDENT, UserType.TEACHER, UserType.ADMIN]).optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const parsedQuery = userQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ 
        message: "Invalid query parameters", 
        errors: parsedQuery.error.format() 
      }, { status: 400 });
    }

    const { page = 1, limit = 10, userType, fullName, email } = parsedQuery.data;
    const pagination = getPaginationParams(page.toString(), limit.toString());

    // Access control: Role-based search permissions
    if (userSession.userType !== UserType.ADMIN) {
      // Non-admin users have specific search limitations
      if (userSession.userType === UserType.STUDENT) {
        // Students can search for teachers (faculty search) and other students
        if (userType && userType !== UserType.TEACHER && userType !== UserType.STUDENT) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
        }
      } else if (userSession.userType === UserType.TEACHER) {
        // Teachers can search for students and other teachers
        if (userType && userType !== UserType.TEACHER && userType !== UserType.STUDENT) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
        }
      }
      
      // If searching by email, allow if it's their own email
      if (email && email === userSession.email) {
        // Allow users to search for their own profile regardless of userType
      } else if (email && userType) {
        // For specific email + userType searches, apply normal restrictions
        // This is already handled by the logic above
      }
    }

    // Build the WHERE clause for filtering
    const whereClause: any = {};
    if (userType) {
      whereClause.userType = userType;
    }

    if (fullName) {
      whereClause.fullName = {
        contains: fullName,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    if (email) {
      whereClause.email = {
        contains: email,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    // Fetch users with pagination and filtering
    const users = await prisma.user.findMany({
      skip: pagination.skip,
      take: pagination.limit,
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        image: true,
        createdAt: true,
        studentProfile: userType === UserType.STUDENT ? {
          select: {
            id: true,
            rollNumber: true,
            section: true,
            year: true,
            batch: true,
            department: true,
          }
        } : false,
        teacherProfile: userType === UserType.TEACHER ? {
          select: {
            id: true,
            affiliation: true,
            designation: true,
            subjectOfInterest: true,
          }
        } : false,
      }
    });

    // Get the total count for pagination metadata
    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json(createPaginatedResponse(users, totalUsers, pagination));

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}