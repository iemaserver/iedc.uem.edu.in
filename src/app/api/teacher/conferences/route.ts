import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PublicationStatus } from "@prisma/client";

// =======================
// Zod Schemas
// =======================
const conferenceSchema = z.object({
  mode: z.string().optional(),
  conferenceName: z.string().min(2).max(200),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.coerce.date(),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updateConferenceSchema = z.object({
  mode: z.string().optional(),
  conferenceName: z.string().min(2).max(200).optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.coerce.date().optional(),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// =======================
// POST /api/teacher/conferences
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
    const result = conferenceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        message: "Invalid request data", 
        errors: result.error.errors 
      }, { status: 400 });
    }

    const conferenceData = result.data;

    // Create conference
    const newConference = await prisma.conference.create({
      data: {
        ...conferenceData,
        teacherId: teacher.id,
      },
      include: { 
        teacher: {
          include: {
            user: { 
              select: { 
                id: true, 
                fullName: true, 
                email: true 
              } 
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Conference created successfully",
      data: newConference 
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teacher/conferences error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error" 
    }, { status: 500 });
  }
}

// =======================
// GET /api/teacher/conferences
// =======================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const {
      page = "1",
      limit = "10",
      isPublic,
      status,
      statusDate,
      mode,
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

        whereClause.teacherId = teacher.id;
      } else {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: teacherId },
        });
        if (!teacher)
          return NextResponse.json(
            { message: "Teacher not found" },
            { status: 404 }
          );

        whereClause.teacherId = teacher.id;
      }
    }

    if (typeof isPublic !== "undefined") {
      whereClause.isPublic = isPublic === "true";
    }

    if (status) whereClause.status = status;
    if (statusDate) whereClause.statusDate = new Date(statusDate);
    if (mode) whereClause.mode = mode;
    if (id) whereClause.id = id;

    const conferences = await prisma.conference.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      where: whereClause,
      orderBy: { statusDate: "desc" },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    const totalCount = await prisma.conference.count({ where: whereClause });

    return NextResponse.json({
      data: conferences,
      meta: {
        totalItems: totalCount,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching conferences:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =======================
// PUT /api/teacher/conferences
// =======================
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);
    console.log("Update request for ID:", id);
    if (!id) {
      return NextResponse.json(
        { message: "Conference ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateConferenceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }

    const updatedConference = await prisma.conference.update({
      where: { id },
      data: result.data,
      include: {
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedConference, { status: 200 });
  } catch (error) {
    console.error("Error updating conference:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE /api/teacher/conferences
// =======================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.userType !== "TEACHER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    console.log("Delete request for ID(s):", typeof ids);
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { message: "Conference ID is required" },
        { status: 400 }
      );
    }

    await prisma.conference.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json(
      { message: "Conference deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conference:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
