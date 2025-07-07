import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for user search
const searchSchema = z.object({
  query: z.string().optional(),
  userType: z.enum(["STUDENT", "FACULTY", "ADMIN"]).optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

// ─────────────────────────────────────────────
// GET: Search users and get user profiles
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { query, userType, page, limit } = searchSchema.parse(searchParams);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } },
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          isVerified: true,
          createdAt: true,
          profileImage: true,

          _count: {
            select: {
              projectMemberships: true,
              advisedProjects: true,
              Paper: true,
              facultyAdvisorPapers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/user/search error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
