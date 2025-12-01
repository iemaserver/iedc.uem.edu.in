import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const schema = z.object({
  name: z.string().min(3),
  isPublic: z.boolean().default(false),
  organizedBy: z.string().optional(),
  sponsoredBy: z.string().optional(),
  venue: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  topic: z.string().optional(),
  certificateUrl: z.string().url().optional().or(z.literal("")),
  remarks: z.string().optional(),
  participants: z.array(z.object({ teacherId: z.string(), participationType: z.string().optional() })).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    const where = session.user.role === UserRole.ADMIN ? {} : { participants: { some: { teacherId: teacherProfile?.id } } };

    const [fdps, total] = await Promise.all([
      prisma.fDP.findMany({ where, include: { participants: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.fDP.count({ where }),
    ]);

    return NextResponse.json({ data: fdps, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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

    const { participants, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const fdp = await tx.fDP.create({ data });
      await tx.fDPParticipant.createMany({ data: participants.map(p => ({ fdpId: fdp.id, teacherId: p.teacherId, participationType: p.participationType })) });
      return tx.fDP.findUnique({ where: { id: fdp.id }, include: { participants: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
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

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids array" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.fDPParticipant.deleteMany({ where: { fdpId: { in: ids } } });
      await tx.fDP.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
