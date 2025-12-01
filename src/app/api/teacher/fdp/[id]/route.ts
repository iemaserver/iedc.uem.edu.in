import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  isPublic: z.boolean().optional(),
  organizedBy: z.string().optional(),
  sponsoredBy: z.string().optional(),
  venue: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  topic: z.string().optional(),
  certificateUrl: z.string().optional(),
  remarks: z.string().optional(),
  participants: z.array(z.object({ teacherId: z.string(), participationType: z.string().optional() })).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await prisma.fDP.findFirst({ where: { id }, include: { participants: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
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

    const { participants, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) await tx.fDP.update({ where: { id }, data: updateData });
      if (participants) {
        await tx.fDPParticipant.deleteMany({ where: { fdpId: id } });
        if (participants.length > 0) await tx.fDPParticipant.createMany({ data: participants.map(p => ({ fdpId: id, teacherId: p.teacherId, participationType: p.participationType })) });
      }
      return tx.fDP.findUnique({ where: { id }, include: { participants: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
    });
    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.fDP.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
