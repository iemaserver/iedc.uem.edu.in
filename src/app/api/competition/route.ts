import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const schema = z.object({
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
  registrationLink: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  posterUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const mode = searchParams.get("mode");
    const isPublished = searchParams.get("isPublished");
    const upcoming = searchParams.get("upcoming");

    const where: any = {};

    // Non-admins only see published competitions
    if (session.user.role !== UserRole.ADMIN) {
      where.isPublished = true;
    } else if (isPublished !== null) {
      where.isPublished = isPublished === "true";
    }

    if (category) {
      where.category = category;
    }

    if (mode) {
      where.mode = mode;
    }

    // Filter for upcoming competitions
    if (upcoming === "true") {
      where.startDate = {
        gte: new Date(),
      };
    }

    const [competitions, total] = await Promise.all([
      prisma.upcomingCompetition.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.upcomingCompetition.count({ where }),
    ]);

    return NextResponse.json({ 
      data: competitions, 
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admins and teachers can create competitions
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER) {
      return NextResponse.json({ 
        error: "Only admins and teachers can create competitions" 
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const competition = await prisma.upcomingCompetition.create({
      data: parsed.data,
    });

    return NextResponse.json({ 
      message: "Competition created successfully", 
      data: competition 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
