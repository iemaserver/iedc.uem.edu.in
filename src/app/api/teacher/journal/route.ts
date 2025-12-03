import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const createJournalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  isPublic: z.boolean().default(false),
  
  journalName: z.string().min(1, "Journal name is required"),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().transform(val => new Date(val)),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  authors: z.array(z.object({ teacherId: z.string(), orderIndex: z.number() })).min(1, "At least one author is required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    if (!teacherProfile && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const where = session.user.role === UserRole.ADMIN
      ? {}
      : { authors: { some: { teacherId: teacherProfile!.id } } };

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.journal.count({ where }),
    ]);

    return NextResponse.json({
      data: journals,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching journals:", error);
    return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createJournalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { authors, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const journal = await tx.journal.create({ data });
      await tx.journalAuthor.createMany({
        data: authors.map((author) => ({ journalId: journal.id, teacherId: author.teacherId, orderIndex: author.orderIndex })),
      });

      return tx.journal.findUnique({
        where: { id: journal.id },
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Journal created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating journal:", error);
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    const ids = idsParam.split(",").map(id => id.trim());
    if (ids.length === 0) return NextResponse.json({ error: "No valid IDs" }, { status: 400 });

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    
    if (session.user.role !== UserRole.ADMIN && teacherProfile) {
      const journals = await prisma.journal.findMany({
        where: { id: { in: ids }, authors: { some: { teacherId: teacherProfile.id } } },
        select: { id: true }
      });
      const validIds = journals.map(j => j.id);
      if (validIds.length === 0) return NextResponse.json({ error: "Unauthorized to delete these journals" }, { status: 403 });
      
      await prisma.$transaction(async (tx) => {
        await tx.journalAuthor.deleteMany({ where: { journalId: { in: validIds } } });
        await tx.journal.deleteMany({ where: { id: { in: validIds } } });
      });
      return NextResponse.json({ message: `Deleted ${validIds.length} journals`, count: validIds.length }, { status: 200 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.journalAuthor.deleteMany({ where: { journalId: { in: ids } } });
      await tx.journal.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: `Deleted ${ids.length} journals`, count: ids.length }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete journals" }, { status: 500 });
  }
}
