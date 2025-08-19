import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ResearchWorkType, UserType } from "@prisma/client";
import { z } from 'zod';
import { 
  getAuthenticatedUser, 
  hasAccess, 
  ApiErrors 
} from "@/utils/apiAuth";

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
  try {
    // Check authentication
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'admin':
        if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
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
        if (!hasAccess(userSession.userType, [UserType.TEACHER, UserType.ADMIN])) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
        }
        
        const uploadedWorkCount = await prisma.researchWork.count({ where: { uploadedById: userSession.id } });
        const advisedPaperCount = await prisma.researchPaper.count({ where: { facultyAdvisors: { some: { id: userSession.id } } } });
        const advisedProjectCount = await prisma.ongoingProject.count({ where: { facultyAdvisors: { some: { id: userSession.id } } } });

        return NextResponse.json({
          uploadedWorkCount,
          advisedPaperCount,
          advisedProjectCount,
        });

      case 'student':
        if (!hasAccess(userSession.userType, [UserType.STUDENT, UserType.ADMIN])) {
          return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
        }
        
        if (userSession.userType === UserType.STUDENT && !userSession.studentProfile) {
          return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        const studentId = userSession.userType === UserType.ADMIN 
          ? searchParams.get('studentId') 
          : userSession.studentProfile?.id;

        if (!studentId) {
          return NextResponse.json({ message: "Student ID required" }, { status: 400 });
        }

        const paperCounts = await prisma.researchPaper.groupBy({ 
          by: ['status'], 
          where: { studentId: studentId }, 
          _count: { id: true } 
        });
        
        const projectCounts = await prisma.ongoingProject.groupBy({ 
          by: ['status'], 
          where: { studentId: studentId }, 
          _count: { id: true } 
        });

        return NextResponse.json({
          researchPaperCounts: paperCounts.map(item => ({ status: item.status, count: item._count.id })),
          ongoingProjectCounts: projectCounts.map(item => ({ status: item.status, count: item._count.id })),
        });

      default:
        return NextResponse.json({ message: "Invalid stats type provided." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}