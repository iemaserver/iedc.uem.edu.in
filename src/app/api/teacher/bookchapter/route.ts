import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const schema = z.object({
  title: z.string().min(3),
  isPublic: z.boolean().default(false),
  status: z.nativeEnum(PublicationStatus),
  isbnIssn: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursement: z.number().int().optional(),
  authorIds: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    const where = session.user.role === UserRole.ADMIN ? {} : { authors: { some: { teacherId: teacherProfile?.id } } };

    const [bookChapters, total] = await Promise.all([
      prisma.bookChapter.findMany({ where, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.bookChapter.count({ where }),
    ]);

    return NextResponse.json({ data: bookChapters, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { authorIds, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const bookChapter = await tx.bookChapter.create({ data });
      await tx.bookChapterAuthor.createMany({ data: authorIds.map((teacherId, index) => ({ bookChapterId: bookChapter.id, teacherId, orderIndex: index })) });
      return tx.bookChapter.findUnique({ where: { id: bookChapter.id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });

    return NextResponse.json({ message: "Created", data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids array" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.bookChapterAuthor.deleteMany({ where: { bookChapterId: { in: ids } } });
      await tx.bookChapter.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted successfully", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
