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

    // Verify user has TEACHER role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can complete this profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      department,
      designation,
      qualification,
      affiliation,
      officialEmail,
      phoneNumber,
      address,
      bio,
      subjectOfInterest,
    } = body;

    // Validate required fields
    if (!department || !designation || !qualification) {
      return NextResponse.json(
        { error: "Department, designation, and qualification are required" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.teacherProfile.update({
        where: { userId: user.id },
        data: {
          department,
          designation,
          qualification,
          affiliation: affiliation || null,
          officialEmail: officialEmail || null,
          phoneNumber: phoneNumber || null,
          address: address || null,
          bio: bio || null,
          subjectOfInterest: subjectOfInterest || [],
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Teacher profile updated successfully",
          profile: updatedProfile,
          redirect: "/dashboard"
        },
        { status: 200 }
      );
    } else {
      // Create new profile
      const newProfile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          department,
          designation,
          qualification,
          affiliation: affiliation || null,
          officialEmail: officialEmail || null,
          phoneNumber: phoneNumber || null,
          address: address || null,
          bio: bio || null,
          subjectOfInterest: subjectOfInterest || [],
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Teacher profile created successfully",
          profile: newProfile,
          redirect: "/dashboard"
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Error completing teacher profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete teacher profile" },
      { status: 500 }
    );
  }
}
