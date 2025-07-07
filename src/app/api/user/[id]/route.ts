import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop()!;

  console.log("Fetching user with ID:", id);

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // First, get basic user info
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        department: true,
        university: true,
        degree: true,
        year: true,
        position: true,
        areaOfInterest: true,
        profileImage: true,
        // Don't include sensitive data
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get counts separately for better performance
    const [
      projectMembershipsCount,
      advisedProjectsCount,
      reviewedProjectsCount,
      authoredPapersCount,
      advisedPapersCount,
      reviewedPapersCount,
    ] = await Promise.all([
      prisma.onGoingProject.count({
        where: { members: { some: { id: user.id } } },
      }),
      prisma.onGoingProject.count({
        where: { facultyAdvisors: { some: { id: user.id } } },
      }),
      prisma.onGoingProject.count({
        where: { reviewerId: user.id },
      }),
      prisma.researchPaper.count({
        where: { author: { some: { id: user.id } } },
      }),
      prisma.researchPaper.count({
        where: { facultyAdvisors: { some: { id: user.id } } },
      }),
      prisma.researchPaper.count({
        where: { reviewerId: user.id },
      }),
    ]);

    return NextResponse.json({
      user,
      statistics: {
        totalProjectsAsMember: projectMembershipsCount,
        totalProjectsAsAdvisor: advisedProjectsCount,
        totalProjectsAsReviewer: reviewedProjectsCount,
        totalPapersAsAuthor: authoredPapersCount,
        totalPapersAsAdvisor: advisedPapersCount,
        totalPapersAsReviewer: reviewedPapersCount,
      },
    });
  }
  catch (error) {
    console.error("GET /users/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split("/").pop()!;
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

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split("/").pop()!;

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



