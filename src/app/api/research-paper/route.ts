import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { z } from "zod";

// Validation schema


// GET - Fetch research papers
export async function GET(req: NextRequest) {
  try {
  

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Build where clause
    const where: any = {};
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    const researchPapers = await prisma.researchPaper.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        reviewedBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true,
      data: researchPapers 
    });
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json(
      { error: "Failed to fetch research papers" },
      { status: 500 }
    );
  }
}
