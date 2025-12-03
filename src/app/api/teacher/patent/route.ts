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

// GET - List all patents
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
    const skip = (page - 1) * limit;

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacherProfile && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const where = session.user.role === UserRole.ADMIN
      ? {}
      : { inventors: { some: { teacherId: teacherProfile!.id } } };

    const [patents, total] = await Promise.all([
      prisma.patent.findMany({
        where,
        include: {
          inventors: {
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

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    const ids = idsParam.split(",").map(id => id.trim());
    if (ids.length === 0) return NextResponse.json({ error: "No valid IDs" }, { status: 400 });

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
    
    if (session.user.role !== UserRole.ADMIN && teacherProfile) {
      const patents = await prisma.patent.findMany({
        where: { id: { in: ids }, inventors: { some: { teacherId: teacherProfile.id } } },
        select: { id: true }
      });
      const validIds = patents.map(p => p.id);
      if (validIds.length === 0) return NextResponse.json({ error: "Unauthorized to delete these patents" }, { status: 403 });
      
      await prisma.$transaction(async (tx) => {
        await tx.patentInventor.deleteMany({ where: { patentId: { in: validIds } } });
        await tx.patent.deleteMany({ where: { id: { in: validIds } } });
      });
      return NextResponse.json({ message: `Deleted ${validIds.length} patents`, count: validIds.length }, { status: 200 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.patentInventor.deleteMany({ where: { patentId: { in: ids } } });
      await tx.patent.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: `Deleted ${ids.length} patents`, count: ids.length }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete patents" }, { status: 500 });
  }
}
