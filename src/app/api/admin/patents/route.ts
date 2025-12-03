import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const patentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  applicant: z.string().min(1, "Applicant is required"),
  applicationNo: z.string().optional(),
  patentNumber: z.string().optional(),
  
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  publicationLink: z.string().optional(),
  patentLink: z.string().optional(),
  country: z.string().optional(),
  
  inventorIds: z.array(z.string()).min(1, "At least one inventor is required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [patents, total] = await Promise.all([
      prisma.patent.findMany({
        include: {
          inventors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.patent.count(),
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { inventorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const patent = await tx.patent.create({ data });
      await tx.patentInventor.createMany({
        data: inventorIds.map((teacherId, index) => ({ patentId: patent.id, teacherId, orderIndex: index })),
      });

      return tx.patent.findUnique({
        where: { id: patent.id },
        include: {
          inventors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
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
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.patent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patent deleted successfully" });
  } catch (error) {
    console.error("Error deleting patent:", error);
    return NextResponse.json({ error: "Failed to delete patent" }, { status: 500 });
  }
}
