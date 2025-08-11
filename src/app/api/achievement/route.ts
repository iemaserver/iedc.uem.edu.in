// app/api/achievements/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { z } from 'zod';


// Zod schema for creating an achievement
const createAchievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  isPublished: z.boolean().default(false).optional(),
  link: z.string().url("Invalid link URL").optional(),
  uploadedById: z.string().min(1, "Uploaded by user ID is required"), // In a real app, this would come from auth context
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = createAchievementSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }

    const newAchievement = await prisma.achievement.create({
      data: parsedData.data,
    });

    return NextResponse.json(newAchievement, { status: 201 });

  } catch (error) {
    console.error("Error creating achievement:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


const getAchievementsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  title: z.string().optional(),
  isPublished: z.string().transform(val => val === 'true').optional(), // Converts 'true'/'false' string to boolean
  uploadedById: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getAchievementsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({ 
        message: "Invalid query parameters", 
        errors: parsedQuery.error.format() 
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, isPublished, uploadedById } = parsedQuery.data;

    const whereClause: any = {};
    if (title) {
      whereClause.title = {
        contains: title,
        mode: 'insensitive',
      };
    }
    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished;
    }
    if (uploadedById) {
      whereClause.uploadedById = uploadedById;
    }

    const achievements = await prisma.achievement.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        uploadedAt: 'desc', // Order by creation date descending
      },
      include: {
        uploadedBy: { select: { fullName: true, userType: true } }, // Include uploader's name and type
      }
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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest) {
    try {
        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });
        }

        const deletedAchievements = await prisma.achievement.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json(deletedAchievements, { status: 200 });

    } catch (error) {
        console.error("Error deleting achievement:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}