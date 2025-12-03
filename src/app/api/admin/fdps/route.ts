import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const fdpSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  organizedBy: z.string().optional(),
  sponsoredBy: z.string().optional(),
  venue: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  topic: z.string().optional(),
  certificateUrl: z.string().optional(),
  remarks: z.string().optional(),
  
  participants: z.array(z.object({
    teacherId: z.string(),
    participationType: z.string().optional(), // Participant, Resource Person, Coordinator
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

    const [fdps, total] = await Promise.all([
      prisma.fDP.findMany({
        include: {
          participants: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fDP.count(),
    ]);

    return NextResponse.json({
      data: fdps,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching FDPs:", error);
    return NextResponse.json({ error: "Failed to fetch FDPs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = fdpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { participants, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const fdp = await tx.fDP.create({ data });
      await tx.fDPParticipant.createMany({
        data: participants.map((p) => ({
          fdpId: fdp.id,
          teacherId: p.teacherId,
          participationType: p.participationType,
        })),
      });

      return tx.fDP.findUnique({
        where: { id: fdp.id },
        include: {
          participants: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "FDP created successfully", data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating FDP:", error);
    return NextResponse.json({ error: "Failed to create FDP" }, { status: 500 });
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

    await prisma.fDP.delete({
      where: { id },
    });

    return NextResponse.json({ message: "FDP deleted successfully" });
  } catch (error) {
    console.error("Error deleting FDP:", error);
    return NextResponse.json({ error: "Failed to delete FDP" }, { status: 500 });
  }
}
