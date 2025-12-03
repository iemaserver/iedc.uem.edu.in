import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updatePatentSchema = z.object({
  title: z.string().min(3).optional(),
  isPublic: z.boolean().optional(),
  applicant: z.string().optional(),
  applicationNo: z.string().optional(),
  patentNumber: z.string().optional(),
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publicationLink: z.string().url().optional().or(z.literal("")),
  patentLink: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  inventorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let teacherProfile = null;
    if (session.user.role !== UserRole.ADMIN) {
      teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } });
      if (!teacherProfile) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const where = session.user.role === UserRole.ADMIN
      ? { id }
      : { id, inventors: { some: { teacherId: teacherProfile!.id } } };

    const patent = await prisma.patent.findFirst({
      where,
      include: {
        inventors: {
          include: {
            teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!patent) return NextResponse.json({ error: "Patent not found" }, { status: 404 });
    return NextResponse.json({ data: patent });
  } catch (error) {
    console.error("Error fetching patent:", error);
    return NextResponse.json({ error: "Failed to fetch patent" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updatePatentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { inventorIds, ...updateData } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.patent.update({ where: { id }, data: updateData });
      }

      if (inventorIds) {
        await tx.patentInventor.deleteMany({ where: { patentId: id } });
        if (inventorIds.length > 0) {
          await tx.patentInventor.createMany({
            data: inventorIds.map((teacherId, index) => ({ patentId: id, teacherId, orderIndex: index })),
          });
        }
      }

      return tx.patent.findUnique({
        where: { id },
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

    return NextResponse.json({ message: "Patent updated successfully", data: result });
  } catch (error) {
    console.error("Error updating patent:", error);
    return NextResponse.json({ error: "Failed to update patent" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.patent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patent deleted successfully" });
  } catch (error) {
    console.error("Error deleting patent:", error);
    return NextResponse.json({ error: "Failed to delete patent" }, { status: 500 });
  }
}
