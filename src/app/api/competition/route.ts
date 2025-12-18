import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";




export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const mode = searchParams.get("mode");
    const isPublished = searchParams.get("isPublished");
    const upcoming = searchParams.get("upcoming");

    const where: any = {};

    if (isPublished !== null) {
      where.isPublished = isPublished === "true";
    }

    if (category) {
      where.category = category;
    }

    if (mode) {
      where.mode = mode;
    }

    // Filter for upcoming competitions
    if (upcoming === "true") {
      where.startDate = {
        gte: new Date(),
      };
    }

    const [competitions, total] = await Promise.all([
      prisma.upcomingCompetition.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.upcomingCompetition.count({ where }),
    ]);

    return NextResponse.json({ 
      data: competitions, 
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
