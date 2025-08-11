// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import {  UserType } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma";



// Zod schema for request query parameters
const userQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  userType: z.enum([UserType.STUDENT, UserType.TEACHER, UserType.ADMIN]).optional(),
  fullName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const parsedQuery = userQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ 
        message: "Invalid query parameters", 
        errors: parsedQuery.error.format() 
      }, { status: 400 });
    }

    const { page = 1, limit = 10, userType, fullName } = parsedQuery.data;
    
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

    // Fetch users with pagination and filtering
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      select: { // Select specific fields to return
        id: true,
        fullName: true,
        email: true,
        userType: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: { select: { section: true, department: true } },
        teacherProfile: { select: { designation: true, affiliation: true } },
      },
    });

    // Get the total count for pagination metadata
    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      data: users,
      meta: {
        totalItems: totalUsers,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}