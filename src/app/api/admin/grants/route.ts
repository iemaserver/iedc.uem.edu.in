import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const grantSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  projectCode: z.string().optional(),
  fundingAgency: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  durationMonths: z.number().optional(),
  grantAmount: z.number().optional(),
  utilizedAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
  
  investigatorIds: z.array(z.object({
    teacherId: z.string(),
    role: z.string(), // PI or Co-PI
  })).min(1),
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

    const [grants, total] = await Promise.all([
      prisma.grantIn.findMany({
        include: {
          investigators: {
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
      prisma.grantIn.count(),
    ]);

    return NextResponse.json({
      data: grants,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching grants:", error);
    return NextResponse.json({ error: "Failed to fetch grants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = grantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { investigatorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const grant = await tx.grantIn.create({ data });
      await tx.grantInvestigator.createMany({
        data: investigatorIds.map((inv, index) => ({
          grantId: grant.id,
          teacherId: inv.teacherId,
          role: inv.role,
          orderIndex: index,
        })),
      });

      return tx.grantIn.findUnique({
        where: { id: grant.id },
        include: {
          investigators: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Grant created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating grant:", error);
    return NextResponse.json({ error: "Failed to create grant" }, { status: 500 });
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

    await prisma.grantIn.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Grant deleted successfully" });
  } catch (error) {
    console.error("Error deleting grant:", error);
    return NextResponse.json({ error: "Failed to delete grant" }, { status: 500 });
  }
}
