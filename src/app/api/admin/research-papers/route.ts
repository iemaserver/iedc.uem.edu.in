import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, SubmissionStatus } from "@prisma/client";

const researchPaperSchema = z.object({
  studentId: z.string(),
  title: z.string().min(3),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).default("DRAFT"),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  approvedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  reviewedById: z.string().optional(),
  members: z.array(z.object({
    memberId: z.string(),
    role: z.string().optional(),
  })).default([]),
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
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status as SubmissionStatus;

    const [papers, total] = await Promise.all([
      prisma.researchPaper.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          reviewedBy: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
          members: {
            include: {
              member: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.researchPaper.count({ where }),
    ]);

    return NextResponse.json({
      data: papers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json({ error: "Failed to fetch research papers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = researchPaperSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { members, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const paper = await tx.researchPaper.create({ data });

      if (members.length > 0) {
        await tx.researchPaperMember.createMany({
          data: members.map((m) => ({
            researchPaperId: paper.id,
            memberId: m.memberId,
            role: m.role,
          })),
        });
      }

      return tx.researchPaper.findUnique({
        where: { id: paper.id },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          reviewedBy: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          members: {
            include: {
              member: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "Research paper created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating research paper:", error);
    return NextResponse.json({ error: "Failed to create research paper" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const body = await req.json();
    const { status } = body;

    const updates: any = { status };
    if (status === "APPROVED") updates.approvedAt = new Date();
    if (status === "PUBLISHED") updates.publishedAt = new Date();

    const paper = await prisma.researchPaper.update({
      where: { id },
      data: updates,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        reviewedBy: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        members: {
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ message: "Research paper updated successfully", data: paper });
  } catch (error) {
    console.error("Error updating research paper:", error);
    return NextResponse.json({ error: "Failed to update research paper" }, { status: 500 });
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

    await prisma.researchPaper.delete({ where: { id } });

    return NextResponse.json({ message: "Research paper deleted successfully" });
  } catch (error) {
    console.error("Error deleting research paper:", error);
    return NextResponse.json({ error: "Failed to delete research paper" }, { status: 500 });
  }
}
