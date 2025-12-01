import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Admin view-only endpoint for single student with all projects and papers
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const {id} = await params;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            image: true,
            createdAt: true,
          },
        },
        researchPapers: {
          include: {
            reviewedBy: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            members: {
              include: {
                member: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        ongoingProjects: {
          include: {
            advisors: {
              include: {
                advisor: { select: { id: true, name: true, email: true } },
              },
            },
            members: {
              include: {
                member: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ data: student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}
