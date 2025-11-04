import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const fdpSchema = z.object({
  name: z.string().min(1),
  organizedBy: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  topic: z.string().optional(),
  remarks: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
   const session = await getServerSession(authOptions);
       if (!session?.user?.id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;

    const where = {
      teacherId: teacher.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { organizedBy: { contains: search, mode: "insensitive" as const } },
          { topic: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [fdps, total] = await Promise.all([
      prisma.fDP.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
      }),
      prisma.fDP.count({ where }),
    ]);

    // Analytics - simplified since no status field in schema
    const yearlyData = await prisma.fDP.findMany({
      where: { teacherId: teacher.id },
      select: { startDate: true },
    });

    const fdpsByYear = yearlyData.reduce((acc, item) => {
      if (item.startDate) {
        const year = new Date(item.startDate).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json({
      fdps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      analytics: {
        totalFDPs: total,
        fdpsByYear,
      },
    });
  } catch (error) {
    console.error("Error fetching FDPs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = fdpSchema.parse(body);

    const fdp = await prisma.fDP.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        teacherId: teacher.id,
      },
    });

    return NextResponse.json(fdp, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating FDP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "FDP ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = fdpSchema.parse(body);

    const existingFDP = await prisma.fDP.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingFDP) {
      return NextResponse.json({ error: "FDP not found" }, { status: 404 });
    }

    const updatedFDP = await prisma.fDP.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    return NextResponse.json(updatedFDP);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating FDP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "FDP ID is required" }, { status: 400 });
    }

    const existingFDP = await prisma.fDP.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingFDP) {
      return NextResponse.json({ error: "FDP not found" }, { status: 404 });
    }

    await prisma.fDP.delete({
      where: { id },
    });

    return NextResponse.json({ message: "FDP deleted successfully" });
  } catch (error) {
    console.error("Error deleting FDP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
