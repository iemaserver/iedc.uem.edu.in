// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";

const getStudentsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  department: z.string().optional(),
  year: z.string().transform(Number).optional(),
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),

});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getStudentsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ message: "Invalid query parameters", errors: parsedQuery.error.format() }, { status: 400 });
    }

    const { page = 1, limit = 10, department, year, name, email } = parsedQuery.data;

    const whereClause: any = {};
    if (department) whereClause.department = department;
    if (year) whereClause.year = year;
    if (name) whereClause.fullName = name;
    if (email) whereClause.email = email;

    const students = await prisma.student.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        user: { select: { id: true, fullName: true, email: true, image: true } },
        researchPapers: { select: { id: true, title: true, status: true } },
        ongoingProjects: { select: { id: true, title: true, status: true } },
      },
    });
    
    const totalStudents = await prisma.student.count({ where: whereClause });

    return NextResponse.json({
      data: students,
      meta: {
        totalItems: totalStudents,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalStudents / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}