import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const ongoingProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  advisorIds: z.array(z.string()).min(1, "At least one advisor is required"),
  memberIds: z.array(z.string()).min(1, "At least one team member is required"),
});

// GET - Fetch ongoing projects
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

    // If user is a student, show their projects
    // If user is a teacher, show projects they're advising
    if (session.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      // Show projects where student is owner OR a member
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
      // Teachers can see projects they're advising
      where.advisors = {
        some: {
          advisorId: session.user.id,
        },
      };
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

    const ongoingProjects = await prisma.ongoingProject.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true,
      data: ongoingProjects 
    });
  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch ongoing projects" },
      { status: 500 }
    );
  }
}

// POST - Create a new ongoing project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can create projects
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can create projects" },
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
    const validatedData = ongoingProjectSchema.parse(body);

    // Verify advisors are teachers
    if (validatedData.advisorIds.length > 0) {
      const advisors = await prisma.user.findMany({
        where: {
          id: { in: validatedData.advisorIds },
          role: "TEACHER",
        },
      });

      if (advisors.length !== validatedData.advisorIds.length) {
        return NextResponse.json(
          { error: "All advisors must be teachers" },
          { status: 400 }
        );
      }
    }

    // Verify members are students
    if (validatedData.memberIds.length > 0) {
      const members = await prisma.user.findMany({
        where: {
          id: { in: validatedData.memberIds },
          role: "STUDENT",
        },
      });

      if (members.length !== validatedData.memberIds.length) {
        return NextResponse.json(
          { error: "All team members must be students" },
          { status: 400 }
        );
      }
    }

    const ongoingProject = await prisma.ongoingProject.create({
      data: {
        title: validatedData.title,
        abstract: validatedData.abstract,
        imageUrl: validatedData.imageUrl,
        documentUrl: validatedData.documentUrl,
        repositoryUrl: validatedData.repositoryUrl,
        keywords: validatedData.keywords,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        expectedEndDate: validatedData.expectedEndDate ? new Date(validatedData.expectedEndDate) : null,
        studentId: studentProfile.id,
        status: "DRAFT",
        advisors: {
          create: validatedData.advisorIds.map((advisorId) => ({
            advisorId,
          })),
        },
        members: {
          create: [
            // Add creator as a member
            {
              memberId: session.user.id,
              role: "Team Lead",
            },
            // Add other members
            ...validatedData.memberIds
              .filter((id) => id !== session.user.id)
              .map((memberId) => ({
                memberId,
                role: "Developer",
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
        advisors: {
          include: {
            advisor: {
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
      message: "Project created successfully",
      data: ongoingProject 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating ongoing project:", error);
    return NextResponse.json(
      { error: "Failed to create ongoing project" },
      { status: 500 }
    );
  }
}
