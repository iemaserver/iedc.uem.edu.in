import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 10, status } = Object.fromEntries(searchParams);
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const whereClause: any = {};
    if (status) whereClause.isPublished = status;

    const projects = await prisma.achievement.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
    });

    const totalProjects = await prisma.achievement.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: projects,
      meta: {
        totalItems: totalProjects,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalProjects / limitNum),
      },
    });

  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
