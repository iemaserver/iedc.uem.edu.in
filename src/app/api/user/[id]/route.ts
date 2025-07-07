import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  
  console.log("Fetching user with ID:", id);

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // User's own projects (as member)
        projectMemberships: {
          include: {
            members: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // Projects the user is advising (as faculty)
        advisedProjects: {
          include: {
            members: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // Projects the user is reviewing
        reviewedProjects: {
          include: {
            members: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // User's own papers (as author)
        Paper: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { submissionDate: "desc" },
        },
        // Papers the user is advising (as faculty)
        facultyAdvisorPapers: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { submissionDate: "desc" },
        },
        // Papers the user is reviewing
        reviewedPapers: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            facultyAdvisors: { select: { id: true, name: true, email: true } },
          },
          orderBy: { submissionDate: "desc" },
        },
   
        // Count statistics
        _count: {
          select: {
            projectMemberships: true,
            advisedProjects: true,
            reviewedProjects: true,
            Paper: true,
            facultyAdvisorPapers: true,
            reviewedPapers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data
    const { password, resetToken, verificationCode, ...safeUser } = user;
    return NextResponse.json({
      user: safeUser,
      statistics: {
        totalProjectsAsMember: user._count?.projectMemberships ?? 0,
        totalProjectsAsAdvisor: user._count?.advisedProjects ?? 0,
        totalProjectsAsReviewer: user._count?.reviewedProjects ?? 0,
        totalPapersAsAuthor: user._count?.Paper ?? 0,
        totalPapersAsAdvisor: user._count?.facultyAdvisorPapers ?? 0,
        totalPapersAsReviewer: user._count?.reviewedPapers ?? 0,
      },
    });
  }
  catch (error) {
    console.error("GET /users/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const body = await req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT /users/:id error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /users/:id error:", error);

    return NextResponse.json(
      { error: "Unable to delete user. They may be linked to other records." },
      { status: 500 }
    );
  }
}



