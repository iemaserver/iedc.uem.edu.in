import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateSchema = z.object({
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

// GET: Fetch a particular student's profile by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {id} = await params;

    // Check if requesting own profile or admin/teacher
    const isOwnProfile = await prisma.studentProfile.findFirst({
      where: { id, userId: session.user.id },
    });

    const isAdminOrTeacher = session.user.role === UserRole.ADMIN || session.user.role === UserRole.TEACHER;
    const showPrivateData = isOwnProfile || isAdminOrTeacher;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        researchPapers: {
          where: showPrivateData ? {} : { status: "PUBLISHED" },
          include: {
           reviewedBy:{
              include: {
                user: { select: { id: true, name: true, email: true } },
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
          orderBy: {
            createdAt: "desc",
          },
        },
        ongoingProjects: {
          where: showPrivateData ? {} : { status: "PUBLISHED" },
          include: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    if (!studentProfile.user.isActive) {
      return NextResponse.json({ error: "Student profile is inactive" }, { status: 403 });
    }

    // Hide sensitive data for non-owners
    if (!showPrivateData) {
      return NextResponse.json({
        data: {
          ...studentProfile,
          phoneNumber: undefined,
          address: undefined,
        },
      });
    }

    return NextResponse.json({ data: studentProfile });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH: Update student's profile (only own profile)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {id} = await params;

    // Verify ownership
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!studentProfile && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "You can only edit your own profile" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.studentProfile.update({
      where: { id },
      data: parsed.data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Profile updated successfully", 
      data: updatedProfile 
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
