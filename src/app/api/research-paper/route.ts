// app/api/research-papers/route.ts

import { NextRequest, NextResponse } from "next/server";
import {  SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma";

const createResearchPaperSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  status: z.nativeEnum(SubmissionStatus).default(SubmissionStatus.UPLOADED),
  keywords: z.array(z.string()).optional(),
  facultyAdvisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = createResearchPaperSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }

    const { keywords, facultyAdvisorIds, memberIds, ...paperData } = parsedData.data;

    const newPaper = await prisma.researchPaper.create({
      data: {
        ...paperData,
        // Correctly handle keywords as a simple array field
        keywords: keywords || [],
        facultyAdvisors: facultyAdvisorIds ? {
          connect: facultyAdvisorIds.map(id => ({ id })),
        } : undefined,
        members: memberIds ? {
          connect: memberIds.map(id => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json(newPaper, { status: 201 });

  } catch (error) {
    console.error("Error creating research paper:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// app/api/research-papers/route.ts

// app/api/research-papers/route.ts (rest of the file)

const getResearchPapersQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  title: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  studentId: z.string().optional(),
  keyword: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getResearchPapersQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ 
        message: "Invalid query parameters", 
        errors: parsedQuery.error.format() 
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, status, studentId, keyword } = parsedQuery.data;

    const whereClause: any = {};
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (status) whereClause.status = status;
    if (studentId) whereClause.studentId = studentId;

    // Corrected logic to filter by keywords, using the 'has' operator
    if (keyword) {
      whereClause.keywords = {
        has: keyword,
      };
    }

    const papers = await prisma.researchPaper.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        student: { select: { user: { select: { fullName: true } } } },
        facultyAdvisors: { select: { fullName: true, id: true } },
        members: { select: { fullName: true, id: true } },
        // No need to include keywords anymore as they are part of the main model
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPapers = await prisma.researchPaper.count({ where: whereClause });

    return NextResponse.json({
      data: papers,
      meta: {
        totalItems: totalPapers,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalPapers / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}