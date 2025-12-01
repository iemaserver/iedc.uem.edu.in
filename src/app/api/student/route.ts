import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: List all active students with basic info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const department = searchParams.get("department");
    const year = searchParams.get("year");
    const section = searchParams.get("section");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      user: {
        isActive: true,
      },
    };

    if (department) {
      where.department = department;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (section) {
      where.section = section;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { rollNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          _count: {
            select: {
              researchPapers: true,
              ongoingProjects: true,
            },
          },
        },
        orderBy: {
          rollNumber: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return NextResponse.json({
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
