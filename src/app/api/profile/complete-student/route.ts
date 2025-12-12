import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has STUDENT role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can complete this profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      rollNumber,
      batch,
      year,
      section,
      department,
      phoneNumber,
      address,
      bio,
    } = body;

    // Validate required fields
    if (!rollNumber || !department || !section) {
      return NextResponse.json(
        { error: "Roll number, department, and section are required" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.studentProfile.update({
        where: { userId: user.id },
        data: {
          rollNumber,
          batch: batch || null,
          year: year || null,
          section,
          department,
          phoneNumber: phoneNumber || null,
          address: address || null,
          bio: bio || null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Student profile updated successfully",
          profile: updatedProfile,
          redirect: "/dashboard"
        },
        { status: 200 }
      );
    } else {
      // Check if roll number already exists
      const existingRollNumber = await prisma.studentProfile.findUnique({
        where: { rollNumber },
      });

      if (existingRollNumber) {
        return NextResponse.json(
          { error: "Roll number already exists" },
          { status: 400 }
        );
      }

      // Create new profile
      const newProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber,
          batch: batch || null,
          year: year || null,
          section,
          department,
          phoneNumber: phoneNumber || null,
          address: address || null,
          bio: bio || null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Student profile created successfully",
          profile: newProfile,
          redirect: "/dashboard"
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Error completing student profile:", error);
    
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Roll number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to complete student profile" },
      { status: 500 }
    );
  }
}
