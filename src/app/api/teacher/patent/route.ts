import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for creating Patent
const patentScema = z.object({
  title: z.string().min(2).max(200),
  inventors: z.string().min(2).max(100),
  applicant:z.string().min(2),
  filedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
  grantedAt: z.coerce.date().optional(),
  publicationLink : z.string().optional(),
  patentLink :      z.string().optional(),
  country  :        z.string().optional(),
  isPublic: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);
    console.log("session is ",session?.user)

    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacherUserId = session.user.id;
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const result = patentScema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const patentData = result.data;

    const newPatent = await prisma.patent.create({
      data: {
        ...patentData,
        teacherId: teacher.id,
      },
    });

    return NextResponse.json(newPatent, { status: 201 });
  } catch (error) {
    console.error("POST /api/Patent error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page = "1", limit = "10", isPublic, filedAt, submittedAt, publishedAt, grantedAt, teacherId } =
      Object.fromEntries(searchParams);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const whereClause: any = {};

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: teacherId },
      });
      if (!teacher) {
        return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
      }
      whereClause.teacherId = teacher.id;
    }

    if (typeof isPublic !== "undefined") {
      whereClause.isPublic = isPublic === "true";
    }

    if (filedAt) whereClause.filedAt = new Date(filedAt);
    if (submittedAt) whereClause.submittedAt = new Date(submittedAt);
    if (publishedAt) whereClause.publishedAt = new Date(publishedAt);
    if (grantedAt) whereClause.grantedAt = new Date(grantedAt);

    const Patents = await prisma.patent.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      where: whereClause,
      orderBy: { submittedAt: "desc" },
    });

    const totalCount = await prisma.patent.count({ where: whereClause });

    return NextResponse.json({
      data: Patents,
      meta: {
        totalItems: totalCount,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching Patents:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const {ids} = await request.json();

    console.log("Delete request for ID(s):", typeof(ids));
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ message: "Patent ID is required" }, { status: 400 });
    }

    

    await prisma.patent.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ message: "Patent deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Patent:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

const updatePatentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  inventors: z.string().min(2).max(100).optional(),
  isPublic: z.boolean().optional(),
  filedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
  grantedAt: z.coerce.date().optional(),
    publicationLink : z.string().optional(),
  patentLink :      z.string().optional(),
  country  :        z.string().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);

    if (!id) {
      return NextResponse.json({ message: "Patent ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const result = updatePatentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const updatedPatent = await prisma.patent.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(updatedPatent, { status: 200 });
  } catch (error) {
    console.error("Error updating Patent:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
