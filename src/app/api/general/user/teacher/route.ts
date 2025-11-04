// app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";

const getTeachersQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  affiliation: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().email().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getTeachersQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ message: "Invalid query parameters", errors: parsedQuery.error.format() }, { status: 400 });
    }

    const { page = 1, limit = 10, affiliation, designation,email } = parsedQuery.data;

    const whereClause: any = {};
    if (affiliation) whereClause.affiliation = affiliation;
    if (designation) whereClause.designation = designation;
    if (email) whereClause.email = email;

    const teachers = await prisma.teacher.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        user: { select: { id: true, fullName: true, email: true, image: true } },
      },
    });

    const totalTeachers = await prisma.teacher.count({ where: whereClause });

    return NextResponse.json({
      data: teachers,
      meta: {
        totalItems: totalTeachers,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalTeachers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}