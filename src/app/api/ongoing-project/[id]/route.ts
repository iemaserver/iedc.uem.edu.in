import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updates
const updateOngoingProjectSchema = z.object({
  title: z.string().min(1).optional(),
  abstract: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  advisorIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "REJECTED"]).optional(),
});

// GET - Fetch single ongoing project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ongoingProject = await prisma.ongoingProject.findUnique({
      where: { id },
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
        advisors: {
          include: {
            advisor: {
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
    });

    if (!ongoingProject) {
      return NextResponse.json(
        { error: "Ongoing project not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = ongoingProject.student.userId === session.user.id;
    const isAdvisor = ongoingProject.advisors.some(
      (a) => a.advisorId === session.user.id
    );
    const isMember = ongoingProject.members.some(
      (m) => m.memberId === session.user.id
    );
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdvisor && !isMember && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      data: ongoingProject 
    });
  } catch (error) {
    console.error("Error fetching ongoing project:", error);
    return NextResponse.json(
      { error: "Failed to fetch ongoing project" },
      { status: 500 }
    );
  }
}

// PUT - Update ongoing project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ongoingProject = await prisma.ongoingProject.findUnique({
      where: { id },
      include: {
        student: true,
        advisors: true,
      },
    });

    if (!ongoingProject) {
      return NextResponse.json(
        { error: "Ongoing project not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateOngoingProjectSchema.parse(body);

    // Check permissions
    const isOwner = ongoingProject.student.userId === session.user.id;
    const isAdvisor = ongoingProject.advisors.some(
      (a) => a.advisorId === session.user.id
    );
    const isAdmin = session.user.role === "ADMIN";

    // Students can only edit their own projects if status is DRAFT or REJECTED
    if (isOwner && !["DRAFT", "REJECTED"].includes(ongoingProject.status)) {
      return NextResponse.json(
        { error: "Cannot edit project after submission" },
        { status: 403 }
      );
    }

    // Only advisors can change status
    if (validatedData.status && !isAdvisor && !isAdmin) {
      return NextResponse.json(
        { error: "Only advisors can change project status" },
        { status: 403 }
      );
    }

    if (!isOwner && !isAdvisor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.abstract !== undefined) updateData.abstract = validatedData.abstract;
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
    if (validatedData.documentUrl !== undefined) updateData.documentUrl = validatedData.documentUrl;
    if (validatedData.repositoryUrl !== undefined) updateData.repositoryUrl = validatedData.repositoryUrl;
    if (validatedData.keywords) updateData.keywords = validatedData.keywords;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.expectedEndDate) updateData.expectedEndDate = new Date(validatedData.expectedEndDate);

    // Handle status changes
    if (validatedData.status) {
      updateData.status = validatedData.status;
      
      if (validatedData.status === "UNDER_REVIEW") {
        updateData.submittedAt = new Date();
      } else if (validatedData.status === "APPROVED") {
        updateData.approvedAt = new Date();
      } else if (validatedData.status === "PUBLISHED") {
        updateData.publishedAt = new Date();
        updateData.completedAt = new Date();
        if (!ongoingProject.approvedAt) {
          updateData.approvedAt = new Date();
        }
      }
    }

    // Update advisors if provided
    if (validatedData.advisorIds && isOwner) {
      // Delete existing advisors
      await prisma.ongoingProjectAdvisor.deleteMany({
        where: { projectId: id },
      });
      
      // Create new advisors
      updateData.advisors = {
        create: validatedData.advisorIds.map((advisorId) => ({
          advisorId,
        })),
      };
    }

    // Update members if provided
    if (validatedData.memberIds && isOwner) {
      // Delete existing members
      await prisma.ongoingProjectMember.deleteMany({
        where: { projectId: id },
      });
      
      // Create new members
      updateData.members = {
        create: [
          {
            memberId: session.user.id,
            role: "Team Lead",
          },
          ...validatedData.memberIds
            .filter((id) => id !== session.user.id)
            .map((memberId) => ({
              memberId,
              role: "Developer",
            })),
        ],
      };
    }

    const updatedProject = await prisma.ongoingProject.update({
      where: { id },
      data: updateData,
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
        advisors: {
          include: {
            advisor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Project updated successfully",
      data: updatedProject 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating ongoing project:", error);
    return NextResponse.json(
      { error: "Failed to update ongoing project" },
      { status: 500 }
    );
  }
}

// DELETE - Delete ongoing project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ongoingProject = await prisma.ongoingProject.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!ongoingProject) {
      return NextResponse.json(
        { error: "Ongoing project not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    const isOwner = ongoingProject.student.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.ongoingProject.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Ongoing project deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting ongoing project:", error);
    return NextResponse.json(
      { error: "Failed to delete ongoing project" },
      { status: 500 }
    );
  }
}
