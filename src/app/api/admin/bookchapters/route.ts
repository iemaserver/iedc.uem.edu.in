import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const bookChapterSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  bookTitle: z.string().optional(),
  chapterNumber: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  isbnIssn: z.string().optional(),
  pageNumbers: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  authorIds: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [bookChapters, total] = await Promise.all([
      prisma.bookChapter.findMany({
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bookChapter.count(),
    ]);

    return NextResponse.json({
      data: bookChapters,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching book chapters:", error);
    return NextResponse.json({ error: "Failed to fetch book chapters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bookChapterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { authorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const bookChapter = await tx.bookChapter.create({ data });
      await tx.bookChapterAuthor.createMany({
        data: authorIds.map((teacherId, index) => ({ bookChapterId: bookChapter.id, teacherId, orderIndex: index })),
      });

      return tx.bookChapter.findUnique({
        where: { id: bookChapter.id },
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Book chapter created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating book chapter:", error);
    return NextResponse.json({ error: "Failed to create book chapter" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.bookChapter.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Book chapter deleted successfully" });
  } catch (error) {
    console.error("Error deleting book chapter:", error);
    return NextResponse.json({ error: "Failed to delete book chapter" }, { status: 500 });
  }
}
