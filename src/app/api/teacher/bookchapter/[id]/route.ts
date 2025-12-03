import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PublicationStatus } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().optional(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  isbnIssn: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursement: z.number().int().optional(),
  authorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await prisma.bookChapter.findFirst({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const { authorIds, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) await tx.bookChapter.update({ where: { id }, data: updateData });
      if (authorIds) {
        await tx.bookChapterAuthor.deleteMany({ where: { bookChapterId: id } });
        if (authorIds.length > 0) await tx.bookChapterAuthor.createMany({ data: authorIds.map((teacherId, index) => ({ bookChapterId: id, teacherId, orderIndex: index })) });
      }
      return tx.bookChapter.findUnique({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });
    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.bookChapter.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
