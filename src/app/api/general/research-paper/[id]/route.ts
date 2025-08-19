import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const project = await prisma.researchPaper.findUnique({
      where: { id: params.id },
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
    });

    if (!project) {
      return NextResponse.json({
        message: "Ongoing project not found"
      }, { status: 404 });
    }

    return NextResponse.json(project);

  } catch (error) {
    console.error("Error fetching ongoing project:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}