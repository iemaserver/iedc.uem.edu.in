import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const certificationSchema = z.object({
  name: z.string().min(1),
  certificationName: z.string().min(1),
  offeredBy: z.string().optional(),
  completedAt: z.string().min(1),
  link: z.string().optional(),
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
          { certificationName: { contains: search, mode: "insensitive" as const } },
          { offeredBy: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [certifications, total] = await Promise.all([
      prisma.certification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { completedAt: "desc" },
      }),
      prisma.certification.count({ where }),
    ]);

    // Analytics - simplified since no status field in schema
    const yearlyData = await prisma.certification.findMany({
      where: { teacherId: teacher.id },
      select: { completedAt: true },
    });

    const certsByYear = yearlyData.reduce((acc, item) => {
      if (item.completedAt) {
        const year = new Date(item.completedAt).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json({
      certifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      analytics: {
        totalCertifications: total,
        certsByYear,
      },
    });
  } catch (error) {
    console.error("Error fetching certifications:", error);
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
    const validatedData = certificationSchema.parse(body);

    const certification = await prisma.certification.create({
      data: {
        ...validatedData,
        completedAt: new Date(validatedData.completedAt),
        teacherId: teacher.id,
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating certification:", error);
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
      return NextResponse.json({ error: "Certification ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = certificationSchema.parse(body);

    const existingCertification = await prisma.certification.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingCertification) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const updatedCertification = await prisma.certification.update({
      where: { id },
      data: {
        ...validatedData,
        completedAt: new Date(validatedData.completedAt),
      },
    });

    return NextResponse.json(updatedCertification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating certification:", error);
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
      return NextResponse.json({ error: "Certification ID is required" }, { status: 400 });
    }

    const existingCertification = await prisma.certification.findFirst({
      where: { id, teacherId: teacher.id },
    });

    if (!existingCertification) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    await prisma.certification.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
