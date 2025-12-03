import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const competitionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  registrationDeadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
  location: z.string().optional(),
  mode: z.string().optional(),
  organizer: z.string().optional(),
  prizeDetails: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  registrationLink: z.string().optional(),
  websiteUrl: z.string().optional(),
  posterUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [competitions, total] = await Promise.all([
      prisma.upcomingCompetition.findMany({
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.upcomingCompetition.count(),
    ]);

    return NextResponse.json({
      data: competitions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = competitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const competition = await prisma.upcomingCompetition.create({
      data: parsed.data,
    });

    return NextResponse.json({ message: "Competition created successfully", data: competition }, { status: 201 });
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json({ error: "Failed to create competition" }, { status: 500 });
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

    const competition = await prisma.upcomingCompetition.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ message: "Competition updated successfully", data: competition });
  } catch (error) {
    console.error("Error updating competition:", error);
    return NextResponse.json({ error: "Failed to update competition" }, { status: 500 });
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

    await prisma.upcomingCompetition.delete({ where: { id } });

    return NextResponse.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json({ error: "Failed to delete competition" }, { status: 500 });
  }
}
