import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Validation schema for patent creation
const createPatentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  isPublic: z.boolean().default(false),
  
  applicant: z.string().min(1, "Applicant is required"),
  applicationNo: z.string().optional(),
  patentNumber: z.string().optional(),
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publicationLink: z.string().url().optional().or(z.literal("")),
  patentLink: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  
  inventors: z.array(z.object({ teacherId: z.string(), orderIndex: z.number() })).min(1, "At least one inventor is required"),
});

// GET - List all patents with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const all = searchParams.get("all") === "true";
    
    // Advanced filtering parameters
    const title = searchParams.get("title");
    const applicant = searchParams.get("applicant");
    const applicationNo = searchParams.get("applicationNo");
    const patentNumber = searchParams.get("patentNumber");
    const country = searchParams.get("country");
    const isPublic = searchParams.get("isPublic");
    
    // Date range filters
    const filedAfter = searchParams.get("filedAfter");
    const filedBefore = searchParams.get("filedBefore");
    const submittedAfter = searchParams.get("submittedAfter");
    const submittedBefore = searchParams.get("submittedBefore");
    const publishedAfter = searchParams.get("publishedAfter");
    const publishedBefore = searchParams.get("publishedBefore");
    const grantedAfter = searchParams.get("grantedAfter");
    const grantedBefore = searchParams.get("grantedBefore");
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
      : { inventors: { some: { teacherId: teacherProfile!.id } } };

    if (title) where.title = { contains: title, mode: "insensitive" };
    if (applicant) where.applicant = { contains: applicant, mode: "insensitive" };
    if (applicationNo) where.applicationNo = { contains: applicationNo, mode: "insensitive" };
    if (patentNumber) where.patentNumber = { contains: patentNumber, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (isPublic !== null) where.isPublic = isPublic === "true";
    
    if (filedAfter || filedBefore) {
      where.filedAt = {
        ...(filedAfter ? { gte: new Date(filedAfter) } : {}),
        ...(filedBefore ? { lte: new Date(filedBefore) } : {}),
      };
    }
    
    if (submittedAfter || submittedBefore) {
      where.submittedAt = {
        ...(submittedAfter ? { gte: new Date(submittedAfter) } : {}),
        ...(submittedBefore ? { lte: new Date(submittedBefore) } : {}),
      };
    }
    
    if (publishedAfter || publishedBefore) {
      where.publishedAt = {
        ...(publishedAfter ? { gte: new Date(publishedAfter) } : {}),
        ...(publishedBefore ? { lte: new Date(publishedBefore) } : {}),
      };
    }
    
    if (grantedAfter || grantedBefore) {
      where.grantedAt = {
        ...(grantedAfter ? { gte: new Date(grantedAfter) } : {}),
        ...(grantedBefore ? { lte: new Date(grantedBefore) } : {}),
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
      where.inventors = {
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
      "title", "applicant", "applicationNo", "patentNumber", "country",
      "filedAt", "submittedAt", "publishedAt", "grantedAt",
      "createdAt", "updatedAt", "isPublic"
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    const [patents, total] = await Promise.all([
      prisma.patent.findMany({
        where,
        include: {
          inventors: {
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
      prisma.patent.count({ where }),
    ]);

    return NextResponse.json({
      data: patents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching patents:", error);
    return NextResponse.json({ error: "Failed to fetch patents" }, { status: 500 });
  }
}

// POST - Create patent
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createPatentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { inventors, ...data } = parsed.data;

    const teacherProfiles = await prisma.teacherProfile.findMany({
      where: { id: { in: inventors.map(inv => inv.teacherId) } },
    });

    if (teacherProfiles.length !== inventors.length) {
      return NextResponse.json({ error: "Invalid inventor IDs" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const patent = await tx.patent.create({ data });

      await tx.patentInventor.createMany({
        data: inventors.map((inventor) => ({
          patentId: patent.id,
          teacherId: inventor.teacherId,
          orderIndex: inventor.orderIndex,
        })),
      });

      return tx.patent.findUnique({
        where: { id: patent.id },
        include: {
          inventors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Patent created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating patent:", error);
    return NextResponse.json({ error: "Failed to create patent" }, { status: 500 });
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
      await tx.patentInventor.deleteMany({ where: { patentId: { in: ids } } });
      await tx.patent.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete patents" }, { status: 500 });
  }
}
