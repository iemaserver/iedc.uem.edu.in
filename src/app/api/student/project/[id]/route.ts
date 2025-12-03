import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { UserRole, SubmissionStatus } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().optional(),
  abstract: z.string().optional(),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  repositoryUrl: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expectedEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  advisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const data = await prisma.ongoingProject.findFirst({
      where: { id },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } } },
        advisors: { include: { advisor: { select: { id: true, name: true, email: true, image: true } } } },
        members: { include: { member: { select: { id: true, name: true, email: true, image: true } } } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    const project = await prisma.ongoingProject.findUnique({ where: { id }, include: { student: true } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && project.student.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own projects" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const { advisorIds, memberIds, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.ongoingProject.update({ where: { id }, data: updateData });
      }

      if (advisorIds !== undefined) {
        await tx.ongoingProjectAdvisor.deleteMany({ where: { projectId: id } });
        if (advisorIds.length > 0) {
          await tx.ongoingProjectAdvisor.createMany({
            data: advisorIds.map(advisorId => ({ projectId: id, advisorId })),
          });
        }
      }

      if (memberIds !== undefined) {
        await tx.ongoingProjectMember.deleteMany({ where: { projectId: id } });
        if (memberIds.length > 0) {
          await tx.ongoingProjectMember.createMany({
            data: memberIds.map(memberId => ({ projectId: id, memberId })),
          });
        }
      }

      return tx.ongoingProject.findUnique({
        where: { id },
        include: {
          student: { include: { user: { select: { id: true, name: true, email: true } } } },
          advisors: { include: { advisor: { select: { id: true, name: true, email: true } } } },
          members: { include: { member: { select: { id: true, name: true, email: true } } } },
        },
      });
    });

    return NextResponse.json({ message: "Updated", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    const project = await prisma.ongoingProject.findUnique({ where: { id }, include: { student: true } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && project.student.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own projects" }, { status: 403 });
    }

    await prisma.ongoingProject.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
