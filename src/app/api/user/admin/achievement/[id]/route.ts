import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    
    if (!id) {
        return NextResponse.json({ error: "Missing achievement ID" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { title, description, image, homePageVisibility, category, achievementDate } = body;
        
        // Validate required fields
        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
        }

     

        // Check if achievement exists
        const existingAchievement = await prisma.achievement.findUnique({
            where: { id },
        });

        if (!existingAchievement) {
            return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
        }

        // Update achievement
        const updatedAchievement = await prisma.achievement.update({
            where: { id },
            data: {
                title,
                description: description  || existingAchievement.description,
                image: image || existingAchievement.image,
                category: category || existingAchievement.category,
                achievementDate: achievementDate ? new Date(achievementDate) : existingAchievement.achievementDate,
                homePageVisibility: homePageVisibility !== undefined ? homePageVisibility : existingAchievement.homePageVisibility,
            },
        });

        return NextResponse.json(updatedAchievement, { status: 200 });
    } catch (error) {
        console.error("Error updating achievement:", error);
        return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    
    if (!id) {
        return NextResponse.json({ error: "Missing achievement ID" }, { status: 400 });
    }

    try {
        const achievement = await prisma.achievement.findUnique({
            where: { id },
        });

        if (!achievement) {
            return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
        }

        return NextResponse.json(achievement, { status: 200 });
    } catch (error) {
        console.error("Error fetching achievement:", error);
        return NextResponse.json({ error: "Failed to fetch achievement" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    
    if (!id) {
        return NextResponse.json({ error: "Missing achievement ID" }, { status: 400 });
    }

    try {
        // Check if achievement exists
        const existingAchievement = await prisma.achievement.findUnique({
            where: { id },
        });

        if (!existingAchievement) {
            return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
        }

        // Delete achievement
        const deletedAchievement = await prisma.achievement.delete({
            where: { id },
        });

        return NextResponse.json({ 
            message: "Achievement deleted successfully",
            achievement: deletedAchievement 
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting achievement:", error);
        return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 });
    }
}
