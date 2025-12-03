import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  link: z.string().optional(),
  achievedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest,  { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;
    const achievement = await prisma.achievement.findUnique({
      where: { id: id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!achievement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if user can view unpublished achievement
    if (!achievement.isPublished && 
        session.user.role !== UserRole.ADMIN && 
        achievement.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: achievement });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    const achievement = await prisma.achievement.findUnique({ where: { id } });
    if (!achievement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership or admin
    if (session.user.role !== UserRole.ADMIN && achievement.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own achievements" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    // Only admins can change isPublished status
    if (parsed.data.isPublished !== undefined && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        error: "Only admins can publish/unpublish achievements" 
      }, { status: 403 });
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: parsed.data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Updated", data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    const achievement = await prisma.achievement.findUnique({ where: { id } });
    if (!achievement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check ownership or admin
    if (session.user.role !== UserRole.ADMIN && achievement.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own achievements" }, { status: 403 });
    }

    await prisma.achievement.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
