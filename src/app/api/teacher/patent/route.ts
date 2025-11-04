import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for creating Patent
const patentSchema = z.object({
  title: z.string().min(1).max(255),
  inventors: z.array(z.string().uuid()).optional(), // multiple teacher User IDs
  applicant: z.string().min(1),
  applicationNo: z.string().optional(),
  filedAt: z.union([z.coerce.date(), z.null()]).optional(),
  submittedAt: z.union([z.coerce.date(), z.null()]).optional(),
  publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
  grantedAt: z.union([z.coerce.date(), z.null()]).optional(),
  publicationLink: z.string().url().optional().or(z.literal("")),
  patentLink: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
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

    const result = patentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { inventors = [], ...patentData } = result.data;

    // Map User IDs to Teacher IDs
    const teacherInventors = await prisma.teacher.findMany({
      where: { userId: { in: inventors } },
      select: { id: true },
    });

    // Combine current teacher ID with inventor IDs, avoid duplicates
    const allInventorIds = Array.from(new Set([
      ...teacherInventors.map(t => t.id),
      teacher.id,
    ]));

    const newPatent = await prisma.patent.create({
      data: {
        ...patentData,
        inventors: {
          connect: allInventorIds.map((id) => ({ id })),
        },
      },
      include: { inventors: true },
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
      if (teacherId === "me") {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
       
        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
        });
         console.log("session is ",teacher)
        if (!teacher) {
          return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
        }

        whereClause.inventors = { some: { id: teacher.id } };
      } else {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: teacherId },
        });
        if (!teacher) {
          return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
        }
        whereClause.inventors = { some: { id: teacher.id } };
      }
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
      include: {
        inventors: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
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
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {ids} = await request.json();

    console.log("Delete request for ID(s):", typeof(ids));
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ message: "Patent ID(s) are required" }, { status: 400 });
    }

    await prisma.patent.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ message: "Patent(s) deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Patent:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

const updatePatentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  inventors: z.array(z.string().uuid()).optional(),
  applicant: z.string().min(1).optional(),
  applicationNo: z.string().optional(),
  isPublic: z.boolean().optional(),
  filedAt: z.union([z.coerce.date(), z.null()]).optional(),
  submittedAt: z.union([z.coerce.date(), z.null()]).optional(),
  publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
  grantedAt: z.union([z.coerce.date(), z.null()]).optional(),
  publicationLink: z.string().url().optional().or(z.literal("")),
  patentLink: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);

    if (!id) {
      return NextResponse.json({ message: "Patent ID is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updatePatentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { inventors, ...rest } = result.data;

    // If inventors are provided, convert user IDs to teacher IDs
    let inventorUpdate = {};
    if (inventors && inventors.length > 0) {
      const teacherInventors = await prisma.teacher.findMany({
        where: { userId: { in: inventors } },
        select: { id: true },
      });

      inventorUpdate = {
        inventors: {
          set: teacherInventors.map((teacher) => ({ id: teacher.id })),
        },
      };
    }

    const updatedPatent = await prisma.patent.update({
      where: { id },
      data: {
        ...rest,
        ...inventorUpdate,
      },
      include: { 
        inventors: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedPatent, { status: 200 });
  } catch (error) {
    console.error("Error updating Patent:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
