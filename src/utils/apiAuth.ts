import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserType } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface UserSession {
  id: string;
  email: string;
  userType: UserType;
  studentProfile?: {
    id: string;
    rollNumber: string;
    department: string;
    year: number;
  };
  teacherProfile?: {
    id: string;
    affiliation: string;
    designation: string;
  };
}

/**
 * Get authenticated user session with profile data
 */
export async function getAuthenticatedUser(): Promise<UserSession | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        studentProfile: {
          select: {
            id: true,
            rollNumber: true,
            department: true,
            year: true,
          }
        },
        teacherProfile: {
          select: {
            id: true,
            affiliation: true,
            designation: true,
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      userType: user.userType,
      studentProfile: user.studentProfile || undefined,
      teacherProfile: user.teacherProfile || undefined,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if user has required access level
 */
export function hasAccess(userType: UserType, requiredAccess: UserType[]): boolean {
  return requiredAccess.includes(userType);
}

/**
 * Check if user can access specific resource
 */
export function canAccessResource(
  userSession: UserSession,
  resourceOwnerId: string,
  allowedRoles: UserType[] = []
): boolean {
  // Admin can access everything
  if (userSession.userType === UserType.ADMIN) {
    return true;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles.includes(userSession.userType)) {
    return true;
  }

  // User can access their own resources
  return userSession.id === resourceOwnerId;
}

/**
 * Check if student can access their own data
 */
export function canStudentAccess(
  userSession: UserSession,
  studentId: string
): boolean {
  if (userSession.userType === UserType.ADMIN) {
    return true;
  }

  if (userSession.userType === UserType.STUDENT && userSession.studentProfile) {
    return userSession.studentProfile.id === studentId;
  }

  return false;
}

/**
 * Check if teacher can access student's data (for advised papers/projects)
 */
export async function canTeacherAccessStudent(
  userSession: UserSession,
  studentId: string,
  resourceType: 'paper' | 'project'
): Promise<boolean> {
  if (userSession.userType === UserType.ADMIN) {
    return true;
  }

  if (userSession.userType !== UserType.TEACHER) {
    return false;
  }

  try {
    // Check if teacher is advisor for this student's papers/projects
    if (resourceType === 'paper') {
      const advisedPaper = await prisma.researchPaper.findFirst({
        where: {
          studentId: studentId,
          facultyAdvisors: {
            some: { id: userSession.id }
          }
        }
      });
      return !!advisedPaper;
    } else {
      const advisedProject = await prisma.ongoingProject.findFirst({
        where: {
          studentId: studentId,
          facultyAdvisors: {
            some: { id: userSession.id }
          }
        }
      });
      return !!advisedProject;
    }
  } catch (error) {
    console.error('Error checking teacher access:', error);
    return false;
  }
}

/**
 * Standard error responses
 */
export const ApiErrors = {
  UNAUTHORIZED: { message: "Authentication required", status: 401 },
  FORBIDDEN: { message: "Access denied", status: 403 },
  NOT_FOUND: { message: "Resource not found", status: 404 },
  VALIDATION_ERROR: { message: "Invalid request data", status: 400 },
  INTERNAL_ERROR: { message: "Internal server error", status: 500 },
} as const;

/**
 * Pagination helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(
  page: string | null = "1",
  limit: string | null = "10"
): PaginationParams {
  const pageNum = Math.max(1, parseInt(page || "1"));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || "10")));
  
  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

/**
 * Standard pagination response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  pagination: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      totalItems,
      currentPage: pagination.page,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    },
  };
}
