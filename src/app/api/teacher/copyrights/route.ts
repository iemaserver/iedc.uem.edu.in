import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// =======================
// Zod Schemas
// =======================
const copyrightSchema = z.object({
  title: z.string().min(2).max(200),
  inventors: z.array(z.string().uuid()).optional(), // multiple teacher IDs
  filedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
  grantedAt: z.coerce.date().optional(),
  isPublic: z.boolean().default(false),
});

const updateCopyrightSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  inventors: z.array(z.string().uuid()).optional(),
  isPublic: z.boolean().optional(),
  filedAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
  grantedAt: z.coerce.date().optional(),
});

// =======================
// POST /api/copyright
// =======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teacherUserId = session.user.id;

    // Get current teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Validate request body
    const result = copyrightSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ message: "Invalid request data", errors: result.error.errors }, { status: 400 });
    }

    const { inventors = [], ...copyrightData } = result.data;

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

    // Create copyright
    const newCopyright = await prisma.copyright.create({
      data: {
        ...copyrightData,
        inventors: {
          connect: allInventorIds.map((id) => ({ id })),
        },
      },
      include: { inventors: true },
    });

    return NextResponse.json(newCopyright, { status: 201 });
  } catch (error) {
    console.error("POST /api/copyright error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
// =======================
// GET /api/copyright
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const {
      page = "1",
      limit = "10",
      isPublic,
      filedAt,
      submittedAt,
      publishedAt,
      grantedAt,
      teacherId,
      id
    } = Object.fromEntries(searchParams);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const whereClause: any = {};
    if (teacherId) {
      if (teacherId === "me") {
        const session = await getServerSession(authOptions);
        if (!session?.user)
          return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );

        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
        });
        if (!teacher)
          return NextResponse.json(
            { message: "Teacher not found" },
            { status: 404 }
          );

        whereClause.inventors = { some: { id: teacher.id } };
      } else {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: teacherId },
        });
        if (!teacher)
          return NextResponse.json(
            { message: "Teacher not found" },
            { status: 404 }
          );

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
    if (id) whereClause.id = id;

    const copyrights = await prisma.copyright.findMany({
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

    const totalCount = await prisma.copyright.count({ where: whereClause });

    return NextResponse.json({
      data: copyrights,
      meta: {
        totalItems: totalCount,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching copyrights:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =======================
// PUT /api/copyright
// =======================
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);

    if (!id) {
      return NextResponse.json(
        { message: "Copyright ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = updateCopyrightSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { inventors, ...rest } = result.data;

    const updatedCopyright = await prisma.copyright.update({
      where: { id },
      data: {
        ...rest,
        ...(inventors
          ? {
              inventors: {
                set: inventors.map((id) => ({ id })), // replace all inventors
              },
            }
          : {}),
      },
      include: { inventors: true },
    });

    return NextResponse.json(updatedCopyright, { status: 200 });
  } catch (error) {
    console.error("Error updating copyright:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    console.log("Delete request for ID(s):", typeof ids);
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { message: "Copyright ID is required" },
        { status: 400 }
      );
    }

    await prisma.copyright.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json(
      { message: "Copyright deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting copyright:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Schema: allow connect/disconnect inventor IDs
const patchInventorsSchema = z.object({
  connect: z.array(z.string().uuid()).optional(),
  disconnect: z.array(z.string().uuid()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);

    if (!id) {
      return NextResponse.json(
        { message: "Copyright ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = patchInventorsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { connect = [], disconnect = [] } = result.data;

    const updated = await prisma.copyright.update({
      where: { id },
      data: {
        inventors: {
          ...(connect.length > 0
            ? { connect: connect.map((id) => ({ id })) }
            : {}),
          ...(disconnect.length > 0
            ? { disconnect: disconnect.map((id) => ({ id })) }
            : {}),
        },
      },
      include: { inventors: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error patching inventors:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
