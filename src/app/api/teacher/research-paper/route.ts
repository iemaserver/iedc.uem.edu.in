import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/apiAuth";
import prisma from "@/lib/prisma";
import { ProjectType, ResearchPaperStatus } from "@prisma/client";
import { researchPaperSchema } from "@/utils/validation";



export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({
        message: "Unauthorized access"
      }, { status: 401 });
    }

    if (user.userType !== "TEACHER") {
      return NextResponse.json({
        message: "Access denied"
      }, { status: 403 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json({
        message: "Teacher profile not found"
      }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const title = url.searchParams.get("title");
    const status = url.searchParams.get("status") as ResearchPaperStatus;
    const projectType = url.searchParams.get("projectType") as ProjectType;

    // Build where clause - Show papers where this teacher is a faculty advisor OR papers needing review
    const whereClause: any = {
      OR: [
        {
          facultyAdvisors: {
            some: {
              id: user.id, // Papers where teacher is faculty advisor
            },
          },
        },
        {
          status: ResearchPaperStatus.UPLOADED, // Papers needing review
        },
      ],
    };
    
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (status) whereClause.status = status;
    if (projectType) whereClause.projectType = projectType;

    const papers = await prisma.researchPaper.findMany({
      skip: (page - 1) * limit,
      take: limit,
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

    const totalPapers = await prisma.researchPaper.count({ where: whereClause });

    return NextResponse.json({
      data: papers,
      meta: {
        totalItems: totalPapers,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalPapers / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({
        message: "Unauthorized access"
      }, { status: 401 });
    }

    if (user.userType !== "TEACHER") {
      return NextResponse.json({
        message: "Access denied"
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = researchPaperSchema.parse(body);

    // Get teacher profile
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json({
        message: "Teacher profile not found"
      }, { status: 404 });
    }

    // Teachers can create research papers and assign themselves as faculty advisors
    const researchPaper = await prisma.researchPaper.create({
      data: {
        title: validatedData.title,
        abstract: validatedData.abstract,
        keywords: validatedData.keywords || [],
        projectType: validatedData.projectType,
        image: validatedData.image,
        fileUrl: validatedData.fileUrl,
        status: ResearchPaperStatus.UPLOADED,
        studentId: teacher.id, // Teacher creates on behalf of student
        facultyAdvisors: {
          connect: [{ id: teacher.id }, ...validatedData.facultyAdvisorIds.map(id => ({ id }))],
        },
        members: validatedData.memberIds?.length ? {
          connect: validatedData.memberIds.map(id => ({ id })),
        } : undefined,
      },
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

    return NextResponse.json({
      message: "Research paper created successfully",
      data: researchPaper,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating research paper:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
