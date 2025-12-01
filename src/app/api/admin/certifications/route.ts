import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const certificationSchema = z.object({
  certificationName: z.string().min(3),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  offeredBy: z.string().optional(),
  platform: z.string().optional(),
  certificateNumber: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  link: z.string().optional(),
  certificateUrl: z.string().optional(),
  remarks: z.string().optional(),
  
  holderIds: z.array(z.string()).min(1),
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

    const [certifications, total] = await Promise.all([
      prisma.certification.findMany({
        include: {
          holders: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.certification.count(),
    ]);

    return NextResponse.json({
      data: certifications,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json({ error: "Failed to fetch certifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = certificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { holderIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const certification = await tx.certification.create({ data });
      await tx.certificationHolder.createMany({
        data: holderIds.map((teacherId) => ({
          certificationId: certification.id,
          teacherId,
        })),
      });

      return tx.certification.findUnique({
        where: { id: certification.id },
        include: {
          holders: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "Certification created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json({ error: "Failed to create certification" }, { status: 500 });
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

    await prisma.certification.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return NextResponse.json({ error: "Failed to delete certification" }, { status: 500 });
  }
}
