import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PublicationStatus } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().optional(),
  isPublic: z.boolean().optional(),
  transactionName: z.string().optional(),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  paperLinkDOI: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  authorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const transaction = await prisma.transaction.findFirst({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: transaction });
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
      if (Object.keys(updateData).length > 0) await tx.transaction.update({ where: { id }, data: updateData });
      if (authorIds) {
        await tx.transactionAuthor.deleteMany({ where: { transactionId: id } });
        if (authorIds.length > 0) await tx.transactionAuthor.createMany({ data: authorIds.map((teacherId, index) => ({ transactionId: id, teacherId, orderIndex: index })) });
      }
      return tx.transaction.findUnique({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });
    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
