import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Admin view-only endpoint for single teacher with all research works
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const {id} = await params;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { 
        userId: id
       },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
           
            image: true,
            createdAt: true,
          },
        },
        copyrights: {
          include: { copyright: true },
        },
        patents: {
          include: { patent: true },
        },
        journals: {
          include: { journal: true },
        },
        conferences: {
          include: { conference: true },
        },
        transactions: {
          include: { transaction: true },
        },
        bookChapters: {
          include: { bookChapter: true },
        },
        grants: {
          include: { grant: true },
        },
        fdps: {
          include: { fdp: true },
        },
        certifications: {
          include: { certification: true },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ data: teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
  }
}
