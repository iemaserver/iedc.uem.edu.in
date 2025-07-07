import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const achievements = await prisma.achievement.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return NextResponse.json(achievements);
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
    }
}
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { homePageVisibility, achievementId } = body;
    console.log("PUT /api/achievement body:", body);

    // Approve achievement
    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        homePageVisibility: homePageVisibility,
      },
    });

    return NextResponse.json({
      message: "Achievement approved successfully",
      achievement,
    });
  } catch (error: any) {
    console.error("PUT /api/achievement error:", error);
    
    if (error) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Failed to approve achievement" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, image, category,link,achievementDate } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
        }
        
        if (!category) {
            return NextResponse.json({ error: "Category is required" }, { status: 400 });
        }
        
        
        const achievement = await prisma.achievement.create({
            data: {
                title,
                description ,
                image,
                link,
                category,
                achievementDate: achievementDate ? new Date(achievementDate) : new Date(),
                homePageVisibility: false, // Default to false
            },
        });
        
        return NextResponse.json(achievement, { status: 201 });
    } catch (error) {
        console.error("Error creating achievement:", error);
        return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const body = await req.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing or invalid achievement IDs array" }, { status: 400 });
    }

    try {
        const deletedAchievements = await prisma.achievement.deleteMany({
            where: { 
                id: { 
                    in: ids 
                } 
            },
        });
        
        return NextResponse.json({ 
            message: `${deletedAchievements.count} achievement(s) deleted successfully`,
            count: deletedAchievements.count 
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting achievements:", error);
        return NextResponse.json({ error: "Failed to delete achievements" }, { status: 500 });
    }
}

