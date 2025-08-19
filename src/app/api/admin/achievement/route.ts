import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const createAchievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  uploadedById: z.string().min(1, "Uploader ID is required"),
  isPublished: z.boolean().default(false).optional(),
  link: z.string().optional(),
});

const getAchievementsQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  title: z.string().optional(),
  uploadedById: z.string().optional(),
  isPublished: z.string().transform(Boolean).optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAchievementSchema.parse(body);

    const newAchievement = await prisma.achievement.create({
      data: validatedData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(newAchievement, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error creating achievement:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getAchievementsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, uploadedById, isPublished } = parsedQuery.data;

    const whereClause: any = {};
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (uploadedById) whereClause.uploadedById = uploadedById;
    if (isPublished !== undefined) whereClause.isPublished = isPublished;

    const achievements = await prisma.achievement.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const totalAchievements = await prisma.achievement.count({ where: whereClause });

    return NextResponse.json({
      data: achievements,
      meta: {
        totalItems: totalAchievements,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalAchievements / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        message: "Invalid or empty array of IDs provided."
      }, { status: 400 });
    }

    const result = await prisma.achievement.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} achievements deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting achievements:", error);
    return NextResponse.json({
      message: "Internal server error."
    }, { status: 500 });
  }
}
