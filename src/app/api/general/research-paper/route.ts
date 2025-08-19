import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 10, status } = Object.fromEntries(searchParams);
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const projects = await prisma.researchPaper.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        facultyAdvisors: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalProjects = await prisma.researchPaper.count({
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
