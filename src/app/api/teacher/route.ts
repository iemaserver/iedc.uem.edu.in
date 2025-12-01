import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: List all active teachers with basic info
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

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacherProfile.findMany({
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
              copyrights: true,
              patents: true,
              journals: true,
              conferences: true,
              bookChapters: true,
              grants: true,
              fdps: true,
              certifications: true,
            },
          },
        },
        orderBy: {
          user: {
            name: "asc",
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teacherProfile.count({ where }),
    ]);

    return NextResponse.json({
      data: teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
