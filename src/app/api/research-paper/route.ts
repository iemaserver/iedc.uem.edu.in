import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const researchPaperSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  reviewedById: z.string().optional(),
  memberIds: z.array(z.string()).default([]),
});

// GET - Fetch research papers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Build where clause
    const where: any = {};
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // If user is a student, show their papers
    // If user is a teacher, show papers they're reviewing or where they're members
    if (session.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      where.OR = [
        { studentId: studentProfile.id },
        {
          members: {
            some: {
              memberId: session.user.id,
            },
          },
        },
      ];
    } else if (session.user.role === "TEACHER") {
      // Teachers can see papers they're reviewing
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }
      
      // Show papers where teacher is reviewer OR a member
      where.OR = [
        { reviewedById: teacherProfile.id },
        { members: { some: { memberId: session.user.id } } }
      ];
    }

    // Override with specific userId if provided (for admin or profile viewing)
    if (userId && session.user.role === "ADMIN") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
      });
      if (studentProfile) {
        where.studentId = studentProfile.id;
      }
    }

    const researchPapers = await prisma.researchPaper.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true,
      data: researchPapers 
    });
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return NextResponse.json(
      { error: "Failed to fetch research papers" },
      { status: 500 }
    );
  }
}

// POST - Create a new research paper
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can create research papers
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can create research papers" },
        { status: 403 }
      );
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = researchPaperSchema.parse(body);
    console.log("Validated data:", validatedData);
    // Verify reviewer is a teacher if provided
    if (validatedData.reviewedById) {
      const reviewer = await prisma.teacherProfile.findFirst({
        where: {
          id: validatedData.reviewedById,
        },
      });

      if (!reviewer) {
        console.error("Reviewer is not a teacher or does not exist");
        return NextResponse.json(
          { error: "Reviewer must be a teacher" },
          { status: 400 }
        );
      }
    }

    const researchPaper = await prisma.researchPaper.create({
      data: {
        title: validatedData.title,
        abstract: validatedData.abstract,
        imageUrl: validatedData.imageUrl,
        documentUrl: validatedData.documentUrl,
        keywords: validatedData.keywords,
        studentId: studentProfile.id,
        status: "DRAFT",
        reviewedById: validatedData.reviewedById,
        members: {
          create: [
            // Add creator as a member
            {
              memberId: session.user.id,
              role: "Lead Author",
            },
            // Add other members
            ...validatedData.memberIds
              .filter((id) => id !== session.user.id)
              .map((memberId) => ({
                memberId,
                role: "Co-Author",
              })),
          ],
        },
      },
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Research paper created successfully",
      data: researchPaper 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating research paper:", error);
    return NextResponse.json(
      { error: "Failed to create research paper" },
      { status: 500 }
    );
  }
}
