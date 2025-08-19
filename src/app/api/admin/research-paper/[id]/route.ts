import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from "@/lib/prisma";
import { ResearchPaperStatus, UserType } from "@prisma/client";
import { 
  getAuthenticatedUser, 
  hasAccess,
  ApiErrors 
} from "@/utils/apiAuth";

// =======================================================
// ZOD SCHEMAS FOR VALIDATION
// =======================================================

const updateResearchPaperStatusSchema = z.object({
  status: z.nativeEnum(ResearchPaperStatus),
  comment: z.string().optional(),
});

// =======================================================
// API HANDLERS
// =======================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can update any research paper
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const validationResult = updateResearchPaperStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        message: "Validation error",
        errors: validationResult.error.format(),
      }, { status: 400 });
    }

    const { status, comment } = validationResult.data;

    // Check if the paper exists
    const existingPaper = await prisma.researchPaper.findUnique({
      where: { id: id },
      include: {
        student: {
          include: {
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
            email: true,
          },
        },
      }
    });

    if (!existingPaper) {
      return NextResponse.json({
        message: "Research paper not found"
      }, { status: 404 });
    }

    // Check if paper is already published (can't be updated)
    if (existingPaper.status === ResearchPaperStatus.ACCEPTED) {
      return NextResponse.json({
        message: "Published research papers cannot be updated"
      }, { status: 400 });
    }

    // Update the paper status
    const updatedPaper = await prisma.researchPaper.update({
      where: { id: id },
      data: {
        status,
        // You might want to add a comment field to your schema for tracking review comments
      },
      include: {
        student: {
          include: {
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
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Research paper status updated to ${status}`,
      data: updatedPaper
    });

  } catch (error) {
    console.error("Error updating research paper:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can view any research paper
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { id } = await params;

    // Get the paper - admin can access any paper
    const paper = await prisma.researchPaper.findUnique({
      where: { id: id },
      include: {
        student: {
          include: {
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
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({
        message: "Research paper not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: paper
    });

  } catch (error) {
    console.error("Error fetching research paper:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    // Only admins can delete any research paper
    if (!hasAccess(userSession.userType, [UserType.ADMIN])) {
      return NextResponse.json(ApiErrors.FORBIDDEN, { status: 403 });
    }

    const { id } = await params;

    // Check if the paper exists
    const existingPaper = await prisma.researchPaper.findUnique({
      where: { id: id }
    });

    if (!existingPaper) {
      return NextResponse.json({
        message: "Research paper not found"
      }, { status: 404 });
    }

    // Delete the paper
    await prisma.researchPaper.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: "Research paper deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting research paper:", error);
    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}
