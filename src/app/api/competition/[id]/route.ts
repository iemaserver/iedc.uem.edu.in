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
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
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
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    const competition = await prisma.upcomingCompetition.findUnique({
      where: { id },
    });

    if (!competition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if user can view unpublished competition
    if (!competition.isPublished && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: competition });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {id} = await params;

    // Only admins and teachers can update competitions
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER) {
      return NextResponse.json({ 
        error: "Only admins and teachers can update competitions" 
      }, { status: 403 });
    }

    const competition = await prisma.upcomingCompetition.findUnique({ where: { id } });
    if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    // Only admins can change isPublished status
    if (parsed.data.isPublished !== undefined && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        error: "Only admins can publish/unpublish competitions" 
      }, { status: 403 });
    }

    const updated = await prisma.upcomingCompetition.update({
      where: { id },
      data: parsed.data,
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

    // Only admins can delete competitions
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        error: "Only admins can delete competitions" 
      }, { status: 403 });
    }

    const competition = await prisma.upcomingCompetition.findUnique({ where: { id } });
    if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.upcomingCompetition.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
