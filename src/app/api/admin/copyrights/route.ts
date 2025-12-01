import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const copyrightSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  
  copyrightNumber: z.string().optional(),
  applicant: z.string().optional(),
  
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  country: z.string().optional(),
  certificateUrl: z.string().optional(),
  
  inventorIds: z.array(z.string()).min(1, "At least one inventor is required"),
});

// GET - List all copyrights (admin can see all)
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

    const [copyrights, total] = await Promise.all([
      prisma.copyright.findMany({
        include: {
          inventors: {
            include: {
              teacher: {
                include: {
                  user: { select: { id: true, name: true, email: true, role: true } },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.copyright.count(),
    ]);

    return NextResponse.json({
      data: copyrights,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching copyrights:", error);
    return NextResponse.json({ error: "Failed to fetch copyrights" }, { status: 500 });
  }
}

// POST - Create new copyright (admin can create for any teacher)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = copyrightSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { inventorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const copyright = await tx.copyright.create({ data });
      await tx.copyrightInventor.createMany({
        data: inventorIds.map((teacherId, index) => ({
          copyrightId: copyright.id,
          teacherId,
          orderIndex: index,
        })),
      });

      return tx.copyright.findUnique({
        where: { id: copyright.id },
        include: {
          inventors: {
            include: {
              teacher: {
                include: {
                  user: { select: { id: true, name: true, email: true, role: true } },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Copyright created successfully",
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating copyright:", error);
    return NextResponse.json({ error: "Failed to create copyright" }, { status: 500 });
  }
}

// DELETE - Soft delete copyright
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.copyright.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Copyright deleted successfully" });
  } catch (error) {
    console.error("Error deleting copyright:", error);
    return NextResponse.json({ error: "Failed to delete copyright" }, { status: 500 });
  }
}
