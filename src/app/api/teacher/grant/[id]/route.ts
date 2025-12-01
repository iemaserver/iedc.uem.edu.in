import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  isPublic: z.boolean().optional(),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  durationMonths: z.number().optional(),
  grantAmount: z.number().optional(),
  utilizedAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
  investigators: z.array(z.object({ teacherId: z.string(), role: z.string() })).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await prisma.grantIn.findFirst({ where: { id }, include: { investigators: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
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

    const { investigators, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) await tx.grantIn.update({ where: { id }, data: updateData });
      if (investigators) {
        await tx.grantInvestigator.deleteMany({ where: { grantId: id } });
        if (investigators.length > 0) await tx.grantInvestigator.createMany({ data: investigators.map((inv, index) => ({ grantId: id, teacherId: inv.teacherId, role: inv.role, orderIndex: index })) });
      }
      return tx.grantIn.findUnique({ where: { id }, include: { investigators: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });
    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.grantIn.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
