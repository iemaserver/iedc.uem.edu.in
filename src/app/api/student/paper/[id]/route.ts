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
  keywords: z.array(z.string()).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  reviewedById: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const data = await prisma.researchPaper.findFirst({
      where: { id },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } } },
        reviewedBy:{
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        
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

    const paper = await prisma.researchPaper.findUnique({ where: { id }, include: { student: true } });
    if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && paper.student.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own papers" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const { memberIds, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.researchPaper.update({ where: { id }, data: updateData });
      }

      if (memberIds !== undefined) {
        await tx.researchPaperMember.deleteMany({ where: { researchPaperId: id } });
        if (memberIds.length > 0) {
          await tx.researchPaperMember.createMany({
            data: memberIds.map(memberId => ({ researchPaperId: id, memberId })),
          });
        }
      }

      return tx.researchPaper.findUnique({
        where: { id },
        include: {
          student: { include: { user: { select: { id: true, name: true, email: true } } } },
          reviewedBy: { include: { user: { select: { id: true, name: true, email: true } } } },
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

    const paper = await prisma.researchPaper.findUnique({ where: { id }, include: { student: true } });
    if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && paper.student.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own papers" }, { status: 403 });
    }

    await prisma.researchPaper.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
