import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    // Get user data to determine role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        studentProfile: true,
        teacherProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

    let chartData: any[] = [];
    let title = "";
    let description = "";

    if (user.userType === "STUDENT") {
      // For students: Research papers and ongoing projects growth
      const researchPapers = await prisma.researchPaper.findMany({
        where: {
          studentId: user.studentProfile?.id,
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          createdAt: true
        }
      });

      const ongoingProjects = await prisma.ongoingProject.findMany({
        where: {
          studentId: user.studentProfile?.id,
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          createdAt: true
        }
      });

      // Create monthly aggregation
      const monthlyStats: { [key: string]: { papers: number; projects: number } } = {};
      
      // Initialize all months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        monthlyStats[monthKey] = { papers: 0, projects: 0 };
      }

      // Count research papers by month
      researchPapers.forEach(paper => {
        const monthKey = paper.createdAt.toISOString().slice(0, 7);
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].papers++;
        }
      });

      // Count projects by month
      ongoingProjects.forEach(project => {
        const monthKey = project.createdAt.toISOString().slice(0, 7);
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].projects++;
        }
      });

      // Convert to chart data
      chartData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, stats]) => {
          const date = new Date(monthKey + "-01");
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            papers: stats.papers,
            projects: stats.projects,
            total: stats.papers + stats.projects
          };
        });

      title = "Your Academic Progress";
      description = "Research papers and ongoing projects uploaded in the last 6 months";

    } else if (user.userType === "TEACHER") {
      // For teachers: Research work growth
      const researchWorks = await prisma.researchWork.findMany({
        where: {
          uploadedById: user.id,
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          createdAt: true
        }
      });

      // Create monthly aggregation
      const monthlyStats: { [key: string]: number } = {};
      
      // Initialize all months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyStats[monthKey] = 0;
      }

      // Count research works by month
      researchWorks.forEach(work => {
        const monthKey = work.createdAt.toISOString().slice(0, 7);
        if (monthlyStats[monthKey] !== undefined) {
          monthlyStats[monthKey]++;
        }
      });

      chartData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, count]) => {
          const date = new Date(monthKey + "-01");
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            researchWorks: count
          };
        });

      title = "Research Work Growth";
      description = "Research works uploaded in the last 6 months";

    } else if (user.userType === "ADMIN") {
      // For admin: User count growth
      const users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          createdAt: true,
          userType: true
        }
      });

      // Create monthly aggregation
      const monthlyStats: { [key: string]: { students: number; teachers: number; total: number } } = {};
      
      // Initialize all months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyStats[monthKey] = { students: 0, teachers: 0, total: 0 };
      }

      // Count users by month and type
      users.forEach(user => {
        const monthKey = user.createdAt.toISOString().slice(0, 7);
        if (monthlyStats[monthKey]) {
          if (user.userType === 'STUDENT') {
            monthlyStats[monthKey].students++;
          } else if (user.userType === 'TEACHER') {
            monthlyStats[monthKey].teachers++;
          }
          monthlyStats[monthKey].total++;
        }
      });

      chartData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, stats]) => {
          const date = new Date(monthKey + "-01");
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            students: stats.students,
            teachers: stats.teachers,
            total: stats.total
          };
        });

      title = "User Registration Growth";
      description = "New user registrations in the last 6 months";
    }

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        title,
        description,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error("Error fetching monthly growth stats:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
}
