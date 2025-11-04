import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const grantInSchema = z.object({
  name: z.string().min(1),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().optional(),
  grantedAt: z.string().optional(),
  durationMonths: z.number().int().optional(),
  grantAmount: z.number().positive().optional(),
  utilizedAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
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
    const status = url.searchParams.get("status") || "";
    
    const skip = (page - 1) * limit;

    const where = {
      teacherId: teacher.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { projectPI: { contains: search, mode: "insensitive" as const } },
          { projectCoPI: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
    };

    const [grantsIn, total] = await Promise.all([
      prisma.grantIn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
      }),
      prisma.grantIn.count({ where }),
    ]);

    // Analytics
    const analytics = await prisma.grantIn.groupBy({
      by: ["status"],
      where: { teacherId: teacher.id },
      _count: true,
      _sum: { grantAmount: true },
    });

    const statusStats = analytics.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = {
          count: item._count,
          amount: item._sum?.grantAmount || 0,
        };
      }
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const totalAmount = analytics.reduce((sum, item) => sum + (item._sum?.grantAmount || 0), 0);

    return NextResponse.json({
      grantsIn,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      analytics: {
        totalGrants: total,
        totalAmount,
        statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching grants in:", error);
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
    const validatedData = grantInSchema.parse(body);

    const grantIn = await prisma.grantIn.create({
      data: {
        ...validatedData,
        appliedAt: validatedData.appliedAt ? new Date(validatedData.appliedAt) : null,
        grantedAt: validatedData.grantedAt ? new Date(validatedData.grantedAt) : null,
        teacherId: teacher.id,
      },
    });

    return NextResponse.json(grantIn, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating grant in:", error);
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
      return NextResponse.json({ error: "Grant ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = grantInSchema.parse(body);

    const existingGrant = await prisma.grantIn.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingGrant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    const updatedGrant = await prisma.grantIn.update({
      where: { id },
      data: {
        ...validatedData,
        appliedAt: validatedData.appliedAt ? new Date(validatedData.appliedAt) : null,
        grantedAt: validatedData.grantedAt ? new Date(validatedData.grantedAt) : null,
      },
    });

    return NextResponse.json(updatedGrant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating grant in:", error);
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
      return NextResponse.json({ error: "Grant ID is required" }, { status: 400 });
    }

    const existingGrant = await prisma.grantIn.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingGrant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    await prisma.grantIn.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Grant deleted successfully" });
  } catch (error) {
    console.error("Error deleting grant in:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
