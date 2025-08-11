import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ResearchWorkType, UserType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const getStudentStatsQuerySchema = z.object({
  department: z.string().optional(),
  year: z.string().transform(Number).optional(),
});

const getTeacherStatsQuerySchema = z.object({
  affiliation: z.string().optional(),
  designation: z.string().optional(),
});

const getResearchWorkStatsQuerySchema = z.object({
  researchWorkType: z.nativeEnum(ResearchWorkType).optional(),
  uploadedByUserType: z.nativeEnum(UserType).optional(),
});

// =======================================================
// API ENDPOINTS
// =======================================================

export async function GET(request: NextRequest) {
  // TODO: Implement an authentication/authorization middleware or check here.
  // This is a placeholder for where you would get the user's role and ID from a JWT or session.
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId'); // Assuming userId is passed for role-specific queries
  const userRole = searchParams.get('userRole'); // Assuming userRole is passed for authorization

  if (!userId || !userRole) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    switch (type) {
      case 'admin':
        if (userRole !== 'ADMIN') {
          return NextResponse.json({ message: "Forbidden: Admins only." }, { status: 403 });
        }
        const userCounts = await prisma.user.groupBy({ by: ['userType'], _count: { id: true } });
        const studentStats = await prisma.student.groupBy({ by: ['department', 'year'], _count: { id: true } });
        const teacherStats = await prisma.teacher.groupBy({ by: ['affiliation', 'designation'], _count: { id: true } });
        const researchWorkStats = await prisma.researchWork.groupBy({ by: ['type'], _count: { id: true } });

        return NextResponse.json({
          users: userCounts.map(item => ({ userType: item.userType, count: item._count.id })),
          students: studentStats.map(item => ({ department: item.department, year: item.year, count: item._count.id })),
          teachers: teacherStats.map(item => ({ affiliation: item.affiliation, designation: item.designation, count: item._count.id })),
          researchWorks: researchWorkStats.map(item => ({ researchWorkType: item.type, count: item._count.id })),
        });

      case 'teacher':
        if (userRole !== 'TEACHER') {
          return NextResponse.json({ message: "Forbidden: Teachers only." }, { status: 403 });
        }
        const uploadedWorkCount = await prisma.researchWork.count({ where: { uploadedById: userId } });
        const advisedPaperCount = await prisma.researchPaper.count({ where: { facultyAdvisors: { some: { id: userId } } } });
        const advisedProjectCount = await prisma.ongoingProject.count({ where: { facultyAdvisors: { some: { id: userId } } } });

        return NextResponse.json({
          uploadedWorkCount,
          advisedPaperCount,
          advisedProjectCount,
        });

      case 'student':
        if (userRole !== 'STUDENT') {
          return NextResponse.json({ message: "Forbidden: Students only." }, { status: 403 });
        }
        const studentProfile = await prisma.student.findUnique({ where: { userId: userId }, select: { id: true } });
        if (!studentProfile) {
          return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        const paperCounts = await prisma.researchPaper.groupBy({ by: ['status'], where: { studentId: studentProfile.id }, _count: { id: true } });
        const projectCounts = await prisma.ongoingProject.groupBy({ by: ['status'], where: { studentId: studentProfile.id }, _count: { id: true } });

        return NextResponse.json({
          researchPaperCounts: paperCounts.map(item => ({ status: item.status, count: item._count.id })),
          ongoingProjectCounts: projectCounts.map(item => ({ status: item.status, count: item._count.id })),
        });

      default:
        return NextResponse.json({ message: "Invalid stats type provided." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}