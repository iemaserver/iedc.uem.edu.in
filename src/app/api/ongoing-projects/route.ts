// app/api/ongoing-projects/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma"; // Assuming your Prisma client is exported from here

// Zod schema for creating an ongoing project
const createOngoingProjectSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  status: z.nativeEnum(SubmissionStatus).default(SubmissionStatus.UPLOADED),
  keywords: z.array(z.string()).optional(), // Keywords as String[]
  facultyAdvisorIds: z.array(z.string()).optional(), // Array of User IDs
  memberIds: z.array(z.string()).optional(), // Array of User IDs
});

// Zod schema for filtering and pagination ongoing projects
const getOngoingProjectsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  title: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  studentId: z.string().optional(),
  keyword: z.string().optional(), // Search by keyword
});

// Zod schema for deleting multiple ongoing projects
const deleteMultipleOngoingProjectsSchema = z.object({
  ids: z.array(z.string().min(1, "ID cannot be empty")).min(1, "At least one ID is required"),
});

// =======================================================
// API ENDPOINTS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = createOngoingProjectSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({
        message: "Invalid input",
        errors: parsedData.error.format(),
      }, { status: 400 });
    }

    const { keywords, facultyAdvisorIds, memberIds, ...projectData } = parsedData.data;

    const newProject = await prisma.ongoingProject.create({
      data: {
        ...projectData,
        // Assign keywords directly as a String[]
        keywords: keywords || [],
        facultyAdvisors: facultyAdvisorIds ? {
          connect: facultyAdvisorIds.map(id => ({ id })),
        } : undefined,
        members: memberIds ? {
          connect: memberIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        student: { select: { user: { select: { fullName: true } } } },
        facultyAdvisors: { select: { fullName: true, id: true } },
        members: { select: { fullName: true, id: true } },
      },
    });

    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error("Error creating ongoing project:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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

    const { page = 1, limit = 10, title, status, studentId, keyword } = parsedQuery.data;

    const whereClause: any = {};
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (status) whereClause.status = status;
    if (studentId) whereClause.studentId = studentId;

    // Search by keyword in the keywords String[] field
    if (keyword) {
      whereClause.keywords = {
        has: keyword, // 'has' operator checks if the array contains the given value
      };
    }

    const projects = await prisma.ongoingProject.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        student: { select: { user: { select: { fullName: true } } } },
        facultyAdvisors: { select: { fullName: true, id: true } },
        members: { select: { fullName: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = deleteMultipleOngoingProjectsSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({
        message: "Invalid input",
        errors: parsedData.error.format(),
      }, { status: 400 });
    }

    const { ids } = parsedData.data;

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
    console.error("Error deleting multiple ongoing projects:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}