import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, OngoingProjectStatus, UserType } from "@prisma/client";
import { getAuthenticatedUser, ApiErrors, hasAccess } from "@/utils/apiAuth";

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

    if (!hasAccess(user.userType, [UserType.ADMIN])) {
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

    // Get all research papers
    const allResearchPapers = await prisma.researchPaper.findMany({
      where: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all ongoing projects
    const allOngoingProjects = await prisma.ongoingProject.findMany({
      where: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user statistics
    const userCounts = await prisma.user.groupBy({
      by: ['userType'],
      _count: {
        userType: true,
      },
      where: {
        isVerified: true,
      },
    });

    const userStats = {
      students: userCounts.find(u => u.userType === 'STUDENT')?._count?.userType || 0,
      teachers: userCounts.find(u => u.userType === 'TEACHER')?._count?.userType || 0,
      admins: userCounts.find(u => u.userType === 'ADMIN')?._count?.userType || 0,
      total: userCounts.reduce((sum, u) => sum + u._count.userType, 0),
    };

    // Calculate metrics
    const researchPaperMetrics = {
      total: allResearchPapers.length,
      uploaded: allResearchPapers.filter(p => p.status === ResearchPaperStatus.UPLOADED).length,
      underReview: allResearchPapers.filter(p => p.status === ResearchPaperStatus.UNDER_REVIEW).length,
      accepted: allResearchPapers.filter(p => p.status === ResearchPaperStatus.ACCEPTED).length,
      rejected: allResearchPapers.filter(p => p.status === ResearchPaperStatus.REJECTED).length,
      withAdvisors: allResearchPapers.filter(p => p.facultyAdvisors.length > 0).length,
      collaborative: allResearchPapers.filter(p => p.members.length > 0).length,
      byProjectType: {
        personal: allResearchPapers.filter(p => p.projectType === 'PERSONAL').length,
        collaborative: allResearchPapers.filter(p => p.projectType === 'COLLABORATIVE').length,
        inIedc: allResearchPapers.filter(p => p.projectType === 'IN_IEDC').length,
      },
    };

    const ongoingProjectMetrics = {
      total: allOngoingProjects.length,
      ongoing: allOngoingProjects.filter(p => p.status === OngoingProjectStatus.ONGOING).length,
      completed: allOngoingProjects.filter(p => p.status === OngoingProjectStatus.COMPLETED).length,
      accepted: allOngoingProjects.filter(p => p.status === OngoingProjectStatus.ACCEPTED).length,
      rejected: allOngoingProjects.filter(p => p.status === OngoingProjectStatus.REJECTED).length,
      withAdvisors: allOngoingProjects.filter(p => p.facultyAdvisors.length > 0).length,
      collaborative: allOngoingProjects.filter(p => p.members.length > 0).length,
    };

    // Time series data for submissions
    const submissionTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResearchPapers = allResearchPapers.filter(p => 
        new Date(p.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayOngoingProjects = allOngoingProjects.filter(p => 
        new Date(p.createdAt).toISOString().split('T')[0] === dateStr
      ).length;

      submissionTrends.push({
        date: dateStr,
        researchPapers: dayResearchPapers,
        ongoingProjects: dayOngoingProjects,
        total: dayResearchPapers + dayOngoingProjects,
      });
    }

    // Status distribution data
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

    // User type distribution
    const userTypeDistribution = [
      { name: 'Students', value: userStats.students, type: 'STUDENT' },
      { name: 'Teachers', value: userStats.teachers, type: 'TEACHER' },
      { name: 'Admins', value: userStats.admins, type: 'ADMIN' },
    ].filter(item => item.value > 0);

    // Project type distribution
    const projectTypeDistribution = [
      { name: 'Personal', value: researchPaperMetrics.byProjectType.personal, type: 'PERSONAL' },
      { name: 'Collaborative', value: researchPaperMetrics.byProjectType.collaborative, type: 'COLLABORATIVE' },
      { name: 'In IEDC', value: researchPaperMetrics.byProjectType.inIedc, type: 'IN_IEDC' },
    ].filter(item => item.value > 0);

    // Monthly submission data
    const monthlySubmissionData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthResearchPapers = allResearchPapers.filter(p => 
        p.createdAt.toISOString().slice(0, 7) === monthStr
      ).length;
      
      const monthOngoingProjects = allOngoingProjects.filter(p => 
        p.createdAt.toISOString().slice(0, 7) === monthStr
      ).length;

      monthlySubmissionData.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        researchPapers: monthResearchPapers,
        ongoingProjects: monthOngoingProjects,
        total: monthResearchPapers + monthOngoingProjects,
      });
    }

    // Active users (users with submissions in the period)
    const activeStudents = new Set([
      ...allResearchPapers.map(p => p.student.user.email),
      ...allOngoingProjects.map(p => p.student.user.email),
    ]).size;

    const activeTeachers = new Set([
      ...allResearchPapers.flatMap(p => p.facultyAdvisors.map(f => f.id)),
      ...allOngoingProjects.flatMap(p => p.facultyAdvisors.map(f => f.id)),
    ]).size;

    // Engagement metrics
    const engagementMetrics = {
      averageAdvisorsPerSubmission: (allResearchPapers.length + allOngoingProjects.length) > 0 ? 
        (allResearchPapers.reduce((sum, p) => sum + p.facultyAdvisors.length, 0) + 
         allOngoingProjects.reduce((sum, p) => sum + p.facultyAdvisors.length, 0)) / 
        (allResearchPapers.length + allOngoingProjects.length) : 0,
      averageMembersPerSubmission: (allResearchPapers.length + allOngoingProjects.length) > 0 ? 
        (allResearchPapers.reduce((sum, p) => sum + p.members.length, 0) + 
         allOngoingProjects.reduce((sum, p) => sum + p.members.length, 0)) / 
        (allResearchPapers.length + allOngoingProjects.length) : 0,
      collaborationRate: (allResearchPapers.length + allOngoingProjects.length) > 0 ? 
        ((researchPaperMetrics.collaborative + ongoingProjectMetrics.collaborative) / 
         (allResearchPapers.length + allOngoingProjects.length) * 100) : 0,
    };

    // Recent activity (last 20 items)
    const recentActivity = [
      ...allResearchPapers.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        type: 'research-paper',
        status: p.status,
        studentName: p.student.user.fullName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      ...allOngoingProjects.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        type: 'ongoing-project',
        status: p.status,
        studentName: p.student.user.fullName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalSubmissions: allResearchPapers.length + allOngoingProjects.length,
          totalUsers: userStats.total,
          activeStudents,
          activeTeachers,
          submissionsThisPeriod: allResearchPapers.length + allOngoingProjects.length,
        },
        metrics: {
          researchPapers: researchPaperMetrics,
          ongoingProjects: ongoingProjectMetrics,
          users: userStats,
          engagement: engagementMetrics,
        },
        charts: {
          submissionTrends,
          statusDistribution,
          userTypeDistribution,
          projectTypeDistribution,
          monthlySubmissionData,
        },
        recentActivity,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors,
      }, { status: 400 });
    }

    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}