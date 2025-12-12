import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updates
const updateResearchPaperSchema = z.object({
  title: z.string().min(1).optional(),
  abstract: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).optional(),
  reviewedById: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "REJECTED"]).optional(),
});

// GET - Fetch single research paper
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

    const researchPaper = await prisma.researchPaper.findUnique({
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
        reviewedBy: {
          include: {
            user: {
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

    if (!researchPaper) {
      return NextResponse.json(
        { error: "Research paper not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = researchPaper.student.userId === session.user.id;
    const isReviewer = researchPaper.reviewedById === session.user.id;
    const isMember = researchPaper.members.some(
      (m) => m.memberId === session.user.id
    );
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isReviewer && !isMember && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      data: researchPaper 
    });
  } catch (error) {
    console.error("Error fetching research paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch research paper" },
      { status: 500 }
    );
  }
}

// PUT - Update research paper
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

    const researchPaper = await prisma.researchPaper.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!researchPaper) {
      return NextResponse.json(
        { error: "Research paper not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateResearchPaperSchema.parse(body);

    // Check permissions
    const isOwner = researchPaper.student.userId === session.user.id;
    const isReviewer = researchPaper.reviewedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    // Students can only edit their own papers if status is DRAFT or REJECTED
    if (isOwner && !["DRAFT", "REJECTED"].includes(researchPaper.status)) {
      return NextResponse.json(
        { error: "Cannot edit paper after submission" },
        { status: 403 }
      );
    }

    // Only reviewer can change status
    if (validatedData.status && !isReviewer && !isAdmin) {
      return NextResponse.json(
        { error: "Only the reviewer can change paper status" },
        { status: 403 }
      );
    }

    if (!isOwner && !isReviewer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.abstract !== undefined) updateData.abstract = validatedData.abstract;
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
    if (validatedData.documentUrl !== undefined) updateData.documentUrl = validatedData.documentUrl;
    if (validatedData.keywords) updateData.keywords = validatedData.keywords;

    // Handle status changes
    if (validatedData.status) {
      updateData.status = validatedData.status;
      
      if (validatedData.status === "UNDER_REVIEW") {
        updateData.submittedAt = new Date();
      } else if (validatedData.status === "APPROVED") {
        updateData.approvedAt = new Date();
      } else if (validatedData.status === "PUBLISHED") {
        updateData.publishedAt = new Date();
        if (!researchPaper.approvedAt) {
          updateData.approvedAt = new Date();
        }
      }
    }

    // Update reviewer if provided
    if (validatedData.reviewedById !== undefined && isOwner) {
      // Verify reviewer is a teacher if not null
      if (validatedData.reviewedById) {
        const reviewer = await prisma.user.findFirst({
          where: {
            id: validatedData.reviewedById,
            role: "TEACHER",
          },
        });

        if (!reviewer) {
          return NextResponse.json(
            { error: "Reviewer must be a teacher" },
            { status: 400 }
          );
        }
      }
      updateData.reviewedById = validatedData.reviewedById;
    }

    // Update members if provided
    if (validatedData.memberIds && isOwner) {
      // Delete existing members
      await prisma.researchPaperMember.deleteMany({
        where: { researchPaperId: id },
      });
      
      // Create new members
      updateData.members = {
        create: [
          {
            memberId: session.user.id,
            role: "Lead Author",
          },
          ...validatedData.memberIds
            .filter((id) => id !== session.user.id)
            .map((memberId) => ({
              memberId,
              role: "Co-Author",
            })),
        ],
      };
    }

    const updatedPaper = await prisma.researchPaper.update({
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
        reviewedBy: {
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
      message: "Research paper updated successfully",
      data: updatedPaper 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating research paper:", error);
    return NextResponse.json(
      { error: "Failed to update research paper" },
      { status: 500 }
    );
  }
}

// DELETE - Delete research paper
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

    const researchPaper = await prisma.researchPaper.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!researchPaper) {
      return NextResponse.json(
        { error: "Research paper not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    const isOwner = researchPaper.student.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.researchPaper.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Research paper deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting research paper:", error);
    return NextResponse.json(
      { error: "Failed to delete research paper" },
      { status: 500 }
    );
  }
}
