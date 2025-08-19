// app/api/teachers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest,  context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const teacherProfile = await prisma.teacher.findUnique({
      where: { id: id },
      include: {
        user: {
          include: {
            researchWorks: {
              include: { authors: true },
              orderBy: { createdAt: 'desc' },
            },
            advisedResearchPapers: {
              include: { student: { select: { user: { select: { fullName: true } } } } },
              orderBy: { createdAt: 'desc' },
            },
            advisedOngoingProjects: {
              include: { student: { select: { user: { select: { fullName: true } } } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!teacherProfile) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    return NextResponse.json(teacherProfile);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}