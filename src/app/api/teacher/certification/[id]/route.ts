import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  certificationName: z.string().optional(),
  isPublic: z.boolean().optional(),
  offeredBy: z.string().optional(),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  link: z.string().optional(),
  remarks: z.string().optional(),
  holderIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await prisma.certification.findFirst({ where: { id }, include: { holders: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
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

    const { holderIds, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) await tx.certification.update({ where: { id }, data: updateData });
      if (holderIds) {
        await tx.certificationHolder.deleteMany({ where: { certificationId: id } });
        if (holderIds.length > 0) await tx.certificationHolder.createMany({ data: holderIds.map(teacherId => ({ certificationId: id, teacherId })) });
      }
      return tx.certification.findUnique({ where: { id }, include: { holders: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
    });
    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.certification.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
