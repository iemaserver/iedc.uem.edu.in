import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userType = session.user.userType;
    const userId = session.user.id;
    
    let chartData = [];

    if (userType === "ADMIN") {
      // Admin sees all system statistics
      const [projectCount, paperCount, achievementCount, userCount] = await Promise.all([
        prisma.onGoingProject.count(),
        prisma.researchPaper.count(),
        prisma.achievement.count(),
        prisma.user.count(),
      ]);

      chartData = [
        {
          category: "projects",
          count: projectCount,
          fill: "var(--chart-1)",
        },
        {
          category: "papers",
          count: paperCount,
          fill: "var(--chart-2)",
        },
        {
          category: "achievements",
          count: achievementCount,
          fill: "var(--chart-3)",
        },
        {
          category: "users",
          count: userCount,
          fill: "var(--chart-4)",
        },
      ];
    } else if (userType === "FACULTY") {
      // Faculty sees only projects and papers they supervise
      const [projectCount, paperCount] = await Promise.all([
        prisma.onGoingProject.count({
          where: {
            facultyAdvisors: {
              some: { id: userId },
            },
          },
        }),
        prisma.researchPaper.count({
          where: {
            facultyAdvisors: {
              some: { id: userId },
            },
          },
        }),
      ]);

      chartData = [
        {
          category: "projects",
          count: projectCount,
          fill: "var(--chart-1)",
        },
        {
          category: "papers",
          count: paperCount,
          fill: "var(--chart-2)",
        },
      ];
    } else {
      // Student sees only their own submissions
      const [projectCount, paperCount] = await Promise.all([
        prisma.onGoingProject.count({
          where: {
            members: {
              some: { id: userId },
            },
          },
        }),
        prisma.researchPaper.count({
          where: {
            author: {
              some: { id: userId },
            },
          },
        }),
      ]);

      chartData = [
        {
          category: "projects",
          count: projectCount,
          fill: "var(--chart-1)",
        },
        {
          category: "papers",
          count: paperCount,
          fill: "var(--chart-2)",
        },
      ];
    }

    return NextResponse.json({
      data: chartData,
      userType,
      total: chartData.reduce((sum, item) => sum + item.count, 0),
    });
  } catch (error) {
    console.error("GET /api/dashboard/chart-data error:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
