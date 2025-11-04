import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, OngoingProjectStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors } from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  type: z.enum(['research-papers', 'ongoing-projects', 'all']).default('all'),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    if (user.userType !== UserType.STUDENT) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    if (!user.studentProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const { period, type } = analyticsQuerySchema.parse(Object.fromEntries(searchParams));

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Arbitrary early date
        break;
    }

    const studentId = user.studentProfile.id;

    // Research Papers Analytics
    const researchPapersData = await prisma.researchPaper.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        projectType: true,
        createdAt: true,
        updatedAt: true,
        facultyAdvisors: {
          select: {
            id: true,
            fullName: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ongoing Projects Analytics
    const ongoingProjectsData = await prisma.ongoingProject.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        startDate: true,
        endDate: true,
        facultyAdvisors: {
          select: {
            id: true,
            fullName: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const researchPaperMetrics = {
      total: researchPapersData.length,
      uploaded: researchPapersData.filter(p => p.status === ResearchPaperStatus.UPLOADED).length,
      underReview: researchPapersData.filter(p => p.status === ResearchPaperStatus.UNDER_REVIEW).length,
      accepted: researchPapersData.filter(p => p.status === ResearchPaperStatus.ACCEPTED).length,
      rejected: researchPapersData.filter(p => p.status === ResearchPaperStatus.REJECTED).length,
      byProjectType: {
        personal: researchPapersData.filter(p => p.projectType === 'PERSONAL').length,
        collaborative: researchPapersData.filter(p => p.projectType === 'COLLABORATIVE').length,
        inIedc: researchPapersData.filter(p => p.projectType === 'IN_IEDC').length,
      },
    };

    const ongoingProjectMetrics = {
      total: ongoingProjectsData.length,
      ongoing: ongoingProjectsData.filter(p => p.status === OngoingProjectStatus.ONGOING).length,
      completed: ongoingProjectsData.filter(p => p.status === OngoingProjectStatus.COMPLETED).length,
      accepted: ongoingProjectsData.filter(p => p.status === OngoingProjectStatus.ACCEPTED).length,
      rejected: ongoingProjectsData.filter(p => p.status === OngoingProjectStatus.REJECTED).length,
    };

    // Time series data for charts (last 30 days)
    const timeSeriesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResearchPapers = researchPapersData.filter(p => 
        new Date(p.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayOngoingProjects = ongoingProjectsData.filter(p => 
        new Date(p.createdAt).toISOString().split('T')[0] === dateStr
      ).length;

      timeSeriesData.push({
        date: dateStr,
        researchPapers: dayResearchPapers,
        ongoingProjects: dayOngoingProjects,
        total: dayResearchPapers + dayOngoingProjects,
      });
    }

    // Recent activity
    const recentActivity = [
      ...researchPapersData.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        type: 'research-paper',
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      ...ongoingProjectsData.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        type: 'ongoing-project',
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);

    // Collaboration metrics
    const totalCollaborators = new Set([
      ...researchPapersData.flatMap(p => [...p.facultyAdvisors.map(f => f.id), ...p.members.map(m => m.id)]),
      ...ongoingProjectsData.flatMap(p => [...p.facultyAdvisors.map(f => f.id), ...p.members.map(m => m.id)]),
    ]).size;

    return NextResponse.json({
      success: true,
      data: {
        period,
        metrics: {
          researchPapers: researchPaperMetrics,
          ongoingProjects: ongoingProjectMetrics,
          totalSubmissions: researchPaperMetrics.total + ongoingProjectMetrics.total,
          totalCollaborators,
        },
        timeSeriesData,
        recentActivity,
        researchPapers: researchPapersData,
        ongoingProjects: ongoingProjectsData,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error fetching student analytics:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}