import { NextRequest, NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

// GET - Fetch ongoing projects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Build where clause
    const where: any = {};
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by userId if provided
    if (userId) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
      });
      if (studentProfile) {
        where.studentId = studentProfile.id;
      }
    }

    const ongoingProjects = await prisma.ongoingProject.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        advisors: {
          include: {
            advisor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true,
      data: ongoingProjects 
    });
  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch ongoing projects" },
      { status: 500 }
    );
  }
}
