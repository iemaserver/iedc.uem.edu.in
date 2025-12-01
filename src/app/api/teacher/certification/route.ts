import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const schema = z.object({
  certificationName: z.string().min(3),
  isPublic: z.boolean().default(false),
  offeredBy: z.string().optional(),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  link: z.string().url().optional().or(z.literal("")),
  remarks: z.string().optional(),
  holderIds: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    const where = session.user.role === UserRole.ADMIN ? {} : { holders: { some: { teacherId: teacherProfile?.id } } };

    const [certifications, total] = await Promise.all([
      prisma.certification.findMany({ where, include: { holders: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.certification.count({ where }),
    ]);

    return NextResponse.json({ data: certifications, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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

    const { holderIds, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const certification = await tx.certification.create({ data });
      await tx.certificationHolder.createMany({ data: holderIds.map(teacherId => ({ certificationId: certification.id, teacherId })) });
      return tx.certification.findUnique({ where: { id: certification.id }, include: { holders: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } } } } });
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
      await tx.certificationHolder.deleteMany({ where: { certificationId: { in: ids } } });
      await tx.certification.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
