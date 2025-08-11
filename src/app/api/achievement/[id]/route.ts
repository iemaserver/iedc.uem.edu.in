// app/api/achievements/[id]/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { z } from 'zod';


// Zod schema for updating an achievement (all fields optional for partial updates)
const updateAchievementSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  isPublished: z.boolean().optional(),
  link: z.string().url("Invalid link URL").optional(),
});

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const achievement = await prisma.achievement.findUnique({
      where: { id: id },
      include: {
        uploadedBy: { select: { fullName: true, userType: true } },
      }
    });

    if (!achievement) {
      return NextResponse.json({ message: "Achievement not found" }, { status: 404 });
    }

    return NextResponse.json(achievement);

  } catch (error) {
    console.error("Error fetching achievement:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const parsedData = updateAchievementSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input for update", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id: id },
      data: parsedData.data,
    });

    return NextResponse.json(updatedAchievement);

  } catch (error) {
    console.error("Error updating achievement:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.achievement.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Achievement deleted successfully" }, { status: 204 });

  } catch (error) {
    console.error("Error deleting achievement:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}