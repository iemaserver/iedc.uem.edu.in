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
    const all = searchParams.get("all") === "true";
    
    // Advanced filtering parameters
    const title = searchParams.get("title");
    const journalName = searchParams.get("journalName");
    const typeOfJournal = searchParams.get("typeOfJournal");
    const indexOfJournal = searchParams.get("indexOfJournal");
    const publisher = searchParams.get("publisher");
    const status = searchParams.get("status");
    const isPublic = searchParams.get("isPublic");
    
    // Date range filters
    const statusAfter = searchParams.get("statusAfter");
    const statusBefore = searchParams.get("statusBefore");
    const impactFactorAfter = searchParams.get("impactFactorAfter");
    const impactFactorBefore = searchParams.get("impactFactorBefore");
    const reimbursementAfter = searchParams.get("reimbursementAfter");
    const reimbursementBefore = searchParams.get("reimbursementBefore");
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
    if (journalName) where.journalName = { contains: journalName, mode: "insensitive" };
    if (typeOfJournal) where.typeOfJournal = { contains: typeOfJournal, mode: "insensitive" };
    if (indexOfJournal) where.indexOfJournal = { contains: indexOfJournal, mode: "insensitive" };
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
    
    if (reimbursementAfter || reimbursementBefore) {
      where.reimbursementDate = {
        ...(reimbursementAfter ? { gte: new Date(reimbursementAfter) } : {}),
        ...(reimbursementBefore ? { lte: new Date(reimbursementBefore) } : {}),
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
      "title", "journalName", "publisher", "status", "statusDate",
      "impactFactor", "impactFactorDate", "reimbursementDate",
      "createdAt", "updatedAt", "isPublic"
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
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

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids array" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.journalAuthor.deleteMany({ where: { journalId: { in: ids } } });
      await tx.journal.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete journals" }, { status: 500 });
  }
}
