import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const createTransactionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  isPublic: z.boolean().default(false),
  
  transactionName: z.string().min(1, "Transaction name is required"),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().transform((val) => new Date(val)),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  
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
    const all = searchParams.get("all") === "true";
    
    // Advanced filtering parameters
    const title = searchParams.get("title");
    const transactionName = searchParams.get("transactionName");
    const typeOfTransaction = searchParams.get("typeOfTransaction");
    const indexOfTransaction = searchParams.get("indexOfTransaction");
    const publisher = searchParams.get("publisher");
    const status = searchParams.get("status");
    const isPublic = searchParams.get("isPublic");
    
    // Date range filters
    const statusAfter = searchParams.get("statusAfter");
    const statusBefore = searchParams.get("statusBefore");
    const impactFactorAfter = searchParams.get("impactFactorAfter");
    const impactFactorBefore = searchParams.get("impactFactorBefore");
    const createdAfter = searchParams.get("createdAfter");
    const createdBefore = searchParams.get("createdBefore");
    const updatedAfter = searchParams.get("updatedAfter");
    const updatedBefore = searchParams.get("updatedBefore");
    
    // Teacher name filter
    const teacherName = searchParams.get("teacherName");
    
    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email! } },
    });

    if (!teacherProfile && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Build where clause
    const where: any = session.user.role === UserRole.ADMIN
      ? {}
      : { authors: { some: { teacherId: teacherProfile!.id } } };

    if (title) where.title = { contains: title, mode: "insensitive" };
    if (transactionName) where.transactionName = { contains: transactionName, mode: "insensitive" };
    if (typeOfTransaction) where.typeOfTransaction = { contains: typeOfTransaction, mode: "insensitive" };
    if (indexOfTransaction) where.indexOfTransaction = { contains: indexOfTransaction, mode: "insensitive" };
    if (publisher) where.publisher = { contains: publisher, mode: "insensitive" };
    if (status) where.status = status;
    if (isPublic !== null) where.isPublic = isPublic === "true";
    
    if (statusAfter || statusBefore) {
      where.statusDate = {
        ...(statusAfter ? { gte: new Date(statusAfter) } : {}),
        ...(statusBefore ? { lte: new Date(statusBefore) } : {}),
      };
    }
    
    if (impactFactorAfter || impactFactorBefore) {
      where.impactFactorDate = {
        ...(impactFactorAfter ? { gte: new Date(impactFactorAfter) } : {}),
        ...(impactFactorBefore ? { lte: new Date(impactFactorBefore) } : {}),
      };
    }
    
    if (createdAfter || createdBefore) {
      where.createdAt = {
        ...(createdAfter ? { gte: new Date(createdAfter) } : {}),
        ...(createdBefore ? { lte: new Date(createdBefore) } : {}),
      };
    }
    
    if (updatedAfter || updatedBefore) {
      where.updatedAt = {
        ...(updatedAfter ? { gte: new Date(updatedAfter) } : {}),
        ...(updatedBefore ? { lte: new Date(updatedBefore) } : {}),
      };
    }
    
    if (teacherName) {
      where.authors = {
        some: {
          teacher: {
            user: {
              name: { contains: teacherName, mode: "insensitive" },
            },
          },
        },
      };
    }

    // Validate sortBy field
    const validSortFields = [
      "title", "transactionName", "publisher", "status", "statusDate",
      "impactFactor", "impactFactorDate",
      "createdAt", "updatedAt", "isPublic"
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          authors: {
            include: {
              teacher: {
                include: {
                  user: { select: { id: true, name: true, email: true, role: true, image: true } },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { [orderByField]: orderByDirection },
        skip: all ? undefined : (page - 1) * limit,
        take: all ? undefined : limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
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
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { authors, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });
      await tx.transactionAuthor.createMany({
        data: authors.map((author) => ({ transactionId: transaction.id, teacherId: author.teacherId, orderIndex: author.orderIndex })),
      });

      return tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true, role: true, image: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Transaction created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    const ids = idsParam.split(",").map(id => id.trim());
    if (ids.length === 0) return NextResponse.json({ error: "No valid IDs" }, { status: 400 });

    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email! } },
    });

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
