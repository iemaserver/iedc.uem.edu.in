import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PublicationStatus } from "@prisma/client";

// Validation schemas
const createBookChapterSchema = z.object({
  status: z.nativeEnum(PublicationStatus),
  name: z.string().min(1, "Book chapter name is required"),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
  isPublic: z.boolean(),
});

const updateBookChapterSchema = z.object({
  status: z.nativeEnum(PublicationStatus).optional(),
  name: z.string().min(1, "Book chapter name is required").optional(),
  registrationFees: z.number().positive().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/teacher/book-chapters
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

    // Get book chapters for this teacher
    const bookChapters = await prisma.bookChapter.findMany({
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(bookChapters);
  } catch (error) {
    console.error("Failed to fetch book chapters:", error);
    return NextResponse.json(
      { message: "Failed to fetch book chapters" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/book-chapters
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
    console.log("Received book chapter data:", body);

    // Validate request body
    const validatedData = createBookChapterSchema.parse(body);

    // Create book chapter
    const bookChapter = await prisma.bookChapter.create({
      data: {
        status: validatedData.status,
        name: validatedData.name,
        registrationFees: validatedData.registrationFees,
        reimbursementStatus: validatedData.reimbursementStatus,
        isbnIssn: validatedData.isbnIssn,
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

    return NextResponse.json(bookChapter, { status: 201 });
  } catch (error) {
    console.error("Failed to create book chapter:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create book chapter" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/book-chapters?id=bookChapterId
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookChapterId = searchParams.get("id");

    if (!bookChapterId) {
      return NextResponse.json({ message: "Book Chapter ID is required" }, { status: 400 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Verify book chapter belongs to this teacher
    const existingBookChapter = await prisma.bookChapter.findFirst({
      where: {
        id: bookChapterId,
        teacherId: teacher.id,
      },
    });

    if (!existingBookChapter) {
      return NextResponse.json({ message: "Book Chapter not found" }, { status: 404 });
    }

    const body = await request.json();
    console.log("Updating book chapter with data:", body);

    // Validate request body
    const validatedData = updateBookChapterSchema.parse(body);

    // Update book chapter
    const bookChapter = await prisma.bookChapter.update({
      where: { id: bookChapterId },
      data: {
        status: validatedData.status,
        name: validatedData.name,
        registrationFees: validatedData.registrationFees,
        reimbursementStatus: validatedData.reimbursementStatus,
        isbnIssn: validatedData.isbnIssn,
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

    return NextResponse.json(bookChapter);
  } catch (error) {
    console.error("Failed to update book chapter:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update book chapter" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/book-chapters?id=bookChapterId
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookChapterId = searchParams.get("id");

    if (!bookChapterId) {
      return NextResponse.json({ message: "Book Chapter ID is required" }, { status: 400 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    // Verify book chapter belongs to this teacher
    const existingBookChapter = await prisma.bookChapter.findFirst({
      where: {
        id: bookChapterId,
        teacherId: teacher.id,
      },
    });

    if (!existingBookChapter) {
      return NextResponse.json({ message: "Book Chapter not found" }, { status: 404 });
    }

    // Delete book chapter
    await prisma.bookChapter.delete({
      where: { id: bookChapterId },
    });

    return NextResponse.json({ message: "Book Chapter deleted successfully" });
  } catch (error) {
    console.error("Failed to delete book chapter:", error);
    return NextResponse.json(
      { message: "Failed to delete book chapter" },
      { status: 500 }
    );
  }
}
