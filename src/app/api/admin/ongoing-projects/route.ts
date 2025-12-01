import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, SubmissionStatus } from "@prisma/client";

const ongoingProjectSchema = z.object({
  studentId: z.string(),
  title: z.string().min(3),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  repositoryUrl: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).default("DRAFT"),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expectedEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  approvedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  advisorIds: z.array(z.string()).default([]),
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

    const [projects, total] = await Promise.all([
      prisma.ongoingProject.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          advisors: {
            include: {
              advisor: { select: { id: true, name: true, email: true, role: true } },
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
      prisma.ongoingProject.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json({ error: "Failed to fetch ongoing projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ongoingProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { advisorIds, members, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.ongoingProject.create({ data });

      if (advisorIds.length > 0) {
        await tx.ongoingProjectAdvisor.createMany({
          data: advisorIds.map((advisorId) => ({
            projectId: project.id,
            advisorId,
          })),
        });
      }

      if (members.length > 0) {
        await tx.ongoingProjectMember.createMany({
          data: members.map((m) => ({
            projectId: project.id,
            memberId: m.memberId,
            role: m.role,
          })),
        });
      }

      return tx.ongoingProject.findUnique({
        where: { id: project.id },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          advisors: {
            include: {
              advisor: { select: { id: true, name: true, email: true } },
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

    return NextResponse.json({ message: "Ongoing project created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating ongoing project:", error);
    return NextResponse.json({ error: "Failed to create ongoing project" }, { status: 500 });
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

    const project = await prisma.ongoingProject.update({
      where: { id },
      data: updates,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        advisors: {
          include: {
            advisor: { select: { id: true, name: true, email: true } },
          },
        },
        members: {
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ message: "Ongoing project updated successfully", data: project });
  } catch (error) {
    console.error("Error updating ongoing project:", error);
    return NextResponse.json({ error: "Failed to update ongoing project" }, { status: 500 });
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

    await prisma.ongoingProject.delete({ where: { id } });

    return NextResponse.json({ message: "Ongoing project deleted successfully" });
  } catch (error) {
    console.error("Error deleting ongoing project:", error);
    return NextResponse.json({ error: "Failed to delete ongoing project" }, { status: 500 });
  }
}
