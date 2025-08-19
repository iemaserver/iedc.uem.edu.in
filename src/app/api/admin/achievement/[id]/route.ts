import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const updateAchievementSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  achievedAt: z.string().datetime().transform(str => new Date(str)).optional(),
  isPublic: z.boolean().optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const achievement = await prisma.achievement.findUnique({
      where: { id: params.id },
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

    if (!achievement) {
      return NextResponse.json({
        message: "Achievement not found"
      }, { status: 404 });
    }

    return NextResponse.json(achievement);

  } catch (error) {
    console.error("Error fetching achievement:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await request.json();
    const validatedData = updateAchievementSchema.parse(body);

    const existingAchievement = await prisma.achievement.findUnique({
      where: { id: params.id },
    });

    if (!existingAchievement) {
      return NextResponse.json({
        message: "Achievement not found"
      }, { status: 404 });
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedAchievement);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error updating achievement:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id: params.id },
    });

    if (!existingAchievement) {
      return NextResponse.json({
        message: "Achievement not found"
      }, { status: 404 });
    }

    await prisma.achievement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Achievement deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting achievement:", error);
    return NextResponse.json({
      message: "Internal server error"
    }, { status: 500 });
  }
}
