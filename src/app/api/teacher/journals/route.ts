import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PublicationStatus } from "@prisma/client";

// Validation schemas
const createJournalSchema = z.object({
  journalName: z.string().min(1, "Journal name is required"),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().positive().optional(),
  impactFactorDate: z.coerce.date().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.coerce.date(),
  paperLinkDOI: z.string().url().optional(),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean(),
});

const updateJournalSchema = z.object({
  journalName: z.string().min(1, "Journal name is required").optional(),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().positive().optional(),
  impactFactorDate: z.coerce.date().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.coerce.date().optional(),
  paperLinkDOI: z.string().url().optional(),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/teacher/journals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Get journals for this teacher
    const journals = await prisma.journal.findMany({
      where: { teacherId: teacher.id },
      include: {
        teacher: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { statusDate: "desc" },
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error("Failed to fetch journals:", error);
    return NextResponse.json(
      { message: "Failed to fetch journals" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/journals
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const body = await request.json();
    console.log("Received journal data:", body);

    // Validate request body
    const validatedData = createJournalSchema.parse(body);

    // Create journal
    const journal = await prisma.journal.create({
      data: {
        journalName: validatedData.journalName,
        typeOfJournal: validatedData.typeOfJournal,
        indexOfJournal: validatedData.indexOfJournal,
        impactFactor: validatedData.impactFactor,
        impactFactorDate: validatedData.impactFactorDate ? new Date(validatedData.impactFactorDate) : undefined,
        publisher: validatedData.publisher,
        status: validatedData.status,
        statusDate: new Date(validatedData.statusDate),
        paperLinkDOI: validatedData.paperLinkDOI,
        registrationFees: validatedData.registrationFees,
        reimbursementStatus: validatedData.reimbursementStatus,
        isPublic: validatedData.isPublic,
        teacherId: teacher.id,
      },
      include: {
        teacher: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(journal, { status: 201 });
  } catch (error) {
    console.error("Failed to create journal:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create journal" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/journals?id=journalId
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const journalId = searchParams.get("id");

    if (!journalId) {
      return NextResponse.json({ message: "Journal ID is required" }, { status: 400 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Verify journal belongs to this teacher
    const existingJournal = await prisma.journal.findFirst({
      where: {
        id: journalId,
        teacherId: teacher.id,
      },
    });

    if (!existingJournal) {
      return NextResponse.json({ message: "Journal not found" }, { status: 404 });
    }

    const body = await request.json();
    console.log("Updating journal with data:", body);

    // Validate request body
    const validatedData = updateJournalSchema.parse(body);

    // Update journal
    const journal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        journalName: validatedData.journalName,
        typeOfJournal: validatedData.typeOfJournal,
        indexOfJournal: validatedData.indexOfJournal,
        impactFactor: validatedData.impactFactor,
        impactFactorDate: validatedData.impactFactorDate ? new Date(validatedData.impactFactorDate) : undefined,
        publisher: validatedData.publisher,
        status: validatedData.status,
        statusDate: validatedData.statusDate ? new Date(validatedData.statusDate) : undefined,
        paperLinkDOI: validatedData.paperLinkDOI,
        registrationFees: validatedData.registrationFees,
        reimbursementStatus: validatedData.reimbursementStatus,
        isPublic: validatedData.isPublic,
      },
      include: {
        teacher: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(journal);
  } catch (error) {
    console.error("Failed to update journal:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update journal" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/journals?id=journalId
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const journalId = searchParams.get("id");

    if (!journalId) {
      return NextResponse.json({ message: "Journal ID is required" }, { status: 400 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Verify journal belongs to this teacher
    const existingJournal = await prisma.journal.findFirst({
      where: {
        id: journalId,
        teacherId: teacher.id,
      },
    });

    if (!existingJournal) {
      return NextResponse.json({ message: "Journal not found" }, { status: 404 });
    }

    // Delete journal
    await prisma.journal.delete({
      where: { id: journalId },
    });

    return NextResponse.json({ message: "Journal deleted successfully" });
  } catch (error) {
    console.error("Failed to delete journal:", error);
    return NextResponse.json(
      { message: "Failed to delete journal" },
      { status: 500 }
    );
  }
}
