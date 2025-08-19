// app/api/upcoming-competitions/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, hasAccess, ApiErrors } from "@/utils/apiAuth";
import { UserType } from "@prisma/client";
import { z } from 'zod';



// Zod schema for creating an upcoming competition
const createUpcomingCompetitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().datetime("Invalid start date format (ISO 8601 expected)").transform(str => new Date(str)),
  endDate: z.string().datetime("Invalid end date format (ISO 8601 expected)").transform(str => new Date(str)).optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  prizeDetails: z.string().optional(),
  registrationLink: z.string().url("Invalid registration link URL").optional(),
  isPublished: z.boolean().default(false).optional(),
}).refine(data => {
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return false; // endDate cannot be before startDate
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});


export async function POST(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can create competitions
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const body = await request.json();
    const parsedData = createUpcomingCompetitionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }

    const newCompetition = await prisma.upcomingCompetition.create({
      data: parsedData.data,
    });

    return NextResponse.json(newCompetition, { status: 201 });

  } catch (error) {
    console.error("Error creating upcoming competition:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


// app/api/upcoming-competitions/route.ts (add to the same file as POST)

// Zod schema for filtering and pagination upcoming competitions
const getUpcomingCompetitionsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  title: z.string().optional(),
});

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

    // Only admins can view all competitions
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = getUpcomingCompetitionsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ 
        message: "Invalid query parameters", 
        errors: parsedQuery.error.format() 
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title } = parsedQuery.data;

    const whereClause: any = {};
    if (title) {
      whereClause.title = {
        contains: title,
        mode: 'insensitive',
      };
    }
    

    const competitions = await prisma.upcomingCompetition.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        startDate: 'asc', // Order by start date ascending
      },
    });

    const totalCompetitions = await prisma.upcomingCompetition.count({ where: whereClause });

    return NextResponse.json({
      data: competitions,
      meta: {
        totalItems: totalCompetitions,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCompetitions / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching upcoming competitions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can delete competitions
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

    // Delete the competitions
    const deleteResult = await prisma.upcomingCompetition.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} competition(s)`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error("Error deleting upcoming competitions:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}