import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const createTransactionSchema = z.object({
  title: z.string().min(3),
  isPublic: z.boolean().default(false),
  transactionName: z.string().min(1),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().transform(val => new Date(val)),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  authors: z.array(z.object({ teacherId: z.string(), orderIndex: z.number() })).min(1, "At least one author is required"),
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

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ data: transactions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { authors, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });
      await tx.transactionAuthor.createMany({ data: authors.map((author) => ({ transactionId: transaction.id, teacherId: author.teacherId, orderIndex: author.orderIndex })) });
      return tx.transaction.findUnique({ where: { id: transaction.id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });

    return NextResponse.json({ message: "Created successfully", data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
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
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: ids }, authors: { some: { teacherId: teacherProfile.id } } },
        select: { id: true }
      });
      const validIds = transactions.map(t => t.id);
      if (validIds.length === 0) return NextResponse.json({ error: "Unauthorized to delete these transactions" }, { status: 403 });
      
      await prisma.$transaction(async (tx) => {
        await tx.transactionAuthor.deleteMany({ where: { transactionId: { in: validIds } } });
        await tx.transaction.deleteMany({ where: { id: { in: validIds } } });
      });
      return NextResponse.json({ message: `Deleted ${validIds.length} transactions`, count: validIds.length }, { status: 200 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transactionAuthor.deleteMany({ where: { transactionId: { in: ids } } });
      await tx.transaction.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: `Deleted ${ids.length} transactions`, count: ids.length }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 });
  }
}
