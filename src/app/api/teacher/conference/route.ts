import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const createConferenceSchema = z.object({
  title: z.string().min(3),
  isPublic: z.boolean().default(false),
  conferenceName: z.string().min(1),
  mode: z.string().optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  location: z.string().optional(),
  conferenceStartDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  conferenceEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().transform(val => new Date(val)),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
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
    const where = session.user.role === UserRole.ADMIN
      ? {}
      : { authors: { some: { teacherId: teacherProfile?.id } } };

    const [conferences, total] = await Promise.all([
      prisma.conference.findMany({
        where,
        include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conference.count({ where }),
    ]);

    return NextResponse.json({ data: conferences, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch conferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createConferenceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { authorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const conference = await tx.conference.create({ data });
      await tx.conferenceAuthor.createMany({ data: authorIds.map((teacherId, index) => ({ conferenceId: conference.id, teacherId, orderIndex: index })) });
      return tx.conference.findUnique({ where: { id: conference.id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });

    return NextResponse.json({ message: "Conference created successfully", data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create conference" }, { status: 500 });
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
      await tx.conferenceAuthor.deleteMany({ where: { conferenceId: { in: ids } } });
      await tx.conference.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
