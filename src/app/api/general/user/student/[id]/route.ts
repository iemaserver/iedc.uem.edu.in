// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const studentProfile = await prisma.student.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, fullName: true, email: true, image: true, userType: true } },
        researchPapers: {
          include: { facultyAdvisors: { select: { fullName: true } } },
        },
        ongoingProjects: {
          include: { facultyAdvisors: { select: { fullName: true } } },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(studentProfile);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}