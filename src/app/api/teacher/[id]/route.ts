import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateSchema = z.object({
  department: z.string().optional(),
  designation: z.string().optional(),
  affiliation: z.string().optional(),
  officialEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  subjectOfInterest: z.array(z.string()).optional(),
  qualification: z.string().optional(),
});

// GET: Fetch a particular teacher's profile by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requesting own profile or admin
    const isOwnProfile = await prisma.teacherProfile.findFirst({
      where: { id, userId: session.user.id },
    });

    const isAdmin = session.user.role === UserRole.ADMIN;
    const showPrivateData = isOwnProfile || isAdmin;

    const teacherProfile = await prisma.teacherProfile.findUnique({
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
        copyrights: {
          where: showPrivateData ? {} : { copyright: { isPublic: true } },
          include: {
            copyright: {
              select: {
                id: true,
                title: true,
                grantedAt: true,
                isPublic: true,
              },
            },
          },
          orderBy: { copyright: { grantedAt: "desc" } },
        },
        patents: {
          where: showPrivateData ? {} : { patent: { isPublic: true } },
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
                grantedAt: true,
                country: true,
                isPublic: true,
              },
            },
          },
          orderBy: { patent: { grantedAt: "desc" } },
        },
        journals: {
          where: showPrivateData ? {} : { journal: { isPublic: true } },
          include: {
            journal: {
              select: {
                id: true,
                title: true,
                journalName: true,
                status: true,
                statusDate: true,
                impactFactor: true,
                paperLinkDOI: true,
                isPublic: true,
              },
            },
          },
          orderBy: { journal: { statusDate: "desc" } },
        },
        conferences: {
          where: showPrivateData ? {} : { conference: { isPublic: true } },
          include: {
            conference: {
              select: {
                id: true,
              
                conferenceName: true,
                conferenceStartDate: true,
                location: true,
                paperLinkDOI: true,
                isPublic: true,
              },
            },
          },
          orderBy: { conference: { conferenceStartDate: "desc" } },
        },
        transactions: {
          where: showPrivateData ? {} : { transaction: { isPublic: true } },
          include: {
            transaction: {
              select: {
                id: true,
                title: true,
                transactionName: true,
                status: true,
                statusDate: true,
                impactFactor: true,
                isPublic: true,
              },
            },
          },
          orderBy: { transaction: { statusDate: "desc" } },
        },
        bookChapters: {
          where: showPrivateData ? {} : { bookChapter: { isPublic: true } },
          include: {
            bookChapter: {
              select: {
                id: true,
                title: true,
                status: true,
                isPublic: true,
              },
            },
          },
        },
        grants: {
          where: showPrivateData ? {} : { grant: { isPublic: true } },
          include: {
            grant: {
              select: {
                id: true,
                title: true,
                projectPI: true,
                projectCoPI: true,
                grantAmount: true,
                status: true,
                grantedAt: true,
                isPublic: true,
              },
            },
          },
          orderBy: { grant: { grantedAt: "desc" } },
        },
        fdps: {
          where: showPrivateData ? {} : { fdp: { isPublic: true } },
          include: {
            fdp: {
              select: {
                id: true,
                name: true,
                organizedBy: true,
                startDate: true,
                endDate: true,
                topic: true,
                isPublic: true,
              },
            },
          },
          orderBy: { fdp: { startDate: "desc" } },
        },
        certifications: {
          where: showPrivateData ? {} : { certification: { isPublic: true } },
          include: {
            certification: {
              select: {
                id: true,
                certificationName: true,
                offeredBy: true,
                completedAt: true,
                isPublic: true,
              },
            },
          },
          orderBy: { certification: { completedAt: "desc" } },
        },
      },
    });

    // Fetch research papers where user is the reviewer
    const advisedResearchPapers = await prisma.researchPaper.findMany({
      where: {
        reviewedById: id,
        status: showPrivateData ? undefined : { in: ["APPROVED", "PUBLISHED"] },
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: showPrivateData ? undefined : 10,
    });

    // Fetch ongoing projects where user is an advisor
    const advisedOngoingProjects = await prisma.ongoingProject.findMany({
      where: {
        advisors: {
          some: {
            advisorId: session.user.id,
          },
        },
        status: showPrivateData ? undefined : { in: ["APPROVED", "PUBLISHED"] },
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: showPrivateData ? undefined : 10,
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    if (!teacherProfile.user.isActive) {
      return NextResponse.json({ error: "Teacher profile is inactive" }, { status: 403 });
    }

    // Add research papers and projects to the response
    const enrichedProfile = {
      ...teacherProfile,
      advisedResearchPapers,
      advisedOngoingProjects,
    };

    return NextResponse.json({ data: enrichedProfile });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH: Update teacher's profile (only own profile)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!teacherProfile && session.user.role !== UserRole.ADMIN) {
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

    const updatedProfile = await prisma.teacherProfile.update({
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
    console.error("Error updating teacher profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
