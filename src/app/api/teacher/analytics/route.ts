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

    if (user.userType !== UserType.TEACHER) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { period } = analyticsQuerySchema.parse(Object.fromEntries(searchParams));

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
        startDate = new Date('2020-01-01');
        break;
    }

    // Research Papers where teacher is faculty advisor
    const researchPapers = await prisma.researchPaper.findMany({
      where: {
        facultyAdvisors: {
          some: { id: user.id }
        },
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
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
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

    // Ongoing Projects where teacher is faculty advisor
    const ongoingProjects = await prisma.ongoingProject.findMany({
      where: {
        facultyAdvisors: {
          some: { id: user.id }
        },
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
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
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

    // Submissions pending review (teacher can review)
    const pendingResearchPapers = await prisma.researchPaper.findMany({
      where: {
        status: ResearchPaperStatus.UPLOADED,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingOngoingProjects = await prisma.ongoingProject.findMany({
      where: {
        status: OngoingProjectStatus.ONGOING,
        facultyAdvisors: {
          none: {}
        },
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const researchPaperMetrics = {
      total: researchPapers.length,
      uploaded: researchPapers.filter(p => p.status === ResearchPaperStatus.UPLOADED).length,
      underReview: researchPapers.filter(p => p.status === ResearchPaperStatus.UNDER_REVIEW).length,
      accepted: researchPapers.filter(p => p.status === ResearchPaperStatus.ACCEPTED).length,
      rejected: researchPapers.filter(p => p.status === ResearchPaperStatus.REJECTED).length,
      approvalRate: researchPapers.length > 0 ? 
        (researchPapers.filter(p => p.status === ResearchPaperStatus.ACCEPTED).length / researchPapers.length * 100).toFixed(1) : 0,
    };

    const ongoingProjectMetrics = {
      total: ongoingProjects.length,
      ongoing: ongoingProjects.filter(p => p.status === OngoingProjectStatus.ONGOING).length,
      completed: ongoingProjects.filter(p => p.status === OngoingProjectStatus.COMPLETED).length,
      accepted: ongoingProjects.filter(p => p.status === OngoingProjectStatus.ACCEPTED).length,
      rejected: ongoingProjects.filter(p => p.status === OngoingProjectStatus.REJECTED).length,
      approvalRate: ongoingProjects.length > 0 ? 
        (ongoingProjects.filter(p => p.status === OngoingProjectStatus.ACCEPTED).length / ongoingProjects.length * 100).toFixed(1) : 0,
    };

    const pendingReviewMetrics = {
      researchPapers: pendingResearchPapers.length,
      ongoingProjects: pendingOngoingProjects.length,
      total: pendingResearchPapers.length + pendingOngoingProjects.length,
    };

    // Time series data for review activity
    const reviewActivityData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResearchPapers = researchPapers.filter(p => 
        new Date(p.updatedAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayOngoingProjects = ongoingProjects.filter(p => 
        new Date(p.updatedAt).toISOString().split('T')[0] === dateStr
      ).length;

      reviewActivityData.push({
        date: dateStr,
        reviewed: dayResearchPapers + dayOngoingProjects,
        researchPapers: dayResearchPapers,
        ongoingProjects: dayOngoingProjects,
      });
    }

    // Student engagement metrics
    const uniqueStudents = new Set([
      ...researchPapers.map(p => p.student.user.email),
      ...ongoingProjects.map(p => p.student.user.email),
    ]).size;

    // Recent review activity
    const recentActivity = [
      ...researchPapers.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        type: 'research-paper',
        status: p.status,
        studentName: p.student.user.fullName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      ...ongoingProjects.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        type: 'ongoing-project',
        status: p.status,
        studentName: p.student.user.fullName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);

    // Status distribution for charts
    const statusDistribution = {
      researchPapers: [
        { name: 'Uploaded', value: researchPaperMetrics.uploaded, status: 'UPLOADED' },
        { name: 'Under Review', value: researchPaperMetrics.underReview, status: 'UNDER_REVIEW' },
        { name: 'Accepted', value: researchPaperMetrics.accepted, status: 'ACCEPTED' },
        { name: 'Rejected', value: researchPaperMetrics.rejected, status: 'REJECTED' },
      ].filter(item => item.value > 0),
      ongoingProjects: [
        { name: 'Ongoing', value: ongoingProjectMetrics.ongoing, status: 'ONGOING' },
        { name: 'Completed', value: ongoingProjectMetrics.completed, status: 'COMPLETED' },
        { name: 'Accepted', value: ongoingProjectMetrics.accepted, status: 'ACCEPTED' },
        { name: 'Rejected', value: ongoingProjectMetrics.rejected, status: 'REJECTED' },
      ].filter(item => item.value > 0),
    };

    // Monthly review performance
    const monthlyReviewData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthResearchPapers = researchPapers.filter(p => 
        p.updatedAt.toISOString().slice(0, 7) === monthStr
      );
      
      const monthOngoingProjects = ongoingProjects.filter(p => 
        p.updatedAt.toISOString().slice(0, 7) === monthStr
      );

      const monthAccepted = [
        ...monthResearchPapers.filter(p => p.status === ResearchPaperStatus.ACCEPTED),
        ...monthOngoingProjects.filter(p => p.status === OngoingProjectStatus.ACCEPTED),
      ].length;

      const monthTotal = monthResearchPapers.length + monthOngoingProjects.length;

      monthlyReviewData.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        total: monthTotal,
        accepted: monthAccepted,
        approvalRate: monthTotal > 0 ? (monthAccepted / monthTotal * 100).toFixed(1) : 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        metrics: {
          researchPapers: researchPaperMetrics,
          ongoingProjects: ongoingProjectMetrics,
          pendingReview: pendingReviewMetrics,
          totalAdvised: researchPaperMetrics.total + ongoingProjectMetrics.total,
          uniqueStudents,
          overallApprovalRate: (researchPaperMetrics.total + ongoingProjectMetrics.total) > 0 ? 
            ((researchPaperMetrics.accepted + ongoingProjectMetrics.accepted) / 
             (researchPaperMetrics.total + ongoingProjectMetrics.total) * 100).toFixed(1) : 0,
        },
        reviewActivityData,
        statusDistribution,
        monthlyReviewData,
        recentActivity,
        pendingSubmissions: {
          researchPapers: pendingResearchPapers,
          ongoingProjects: pendingOngoingProjects,
        },
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error fetching teacher analytics:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}