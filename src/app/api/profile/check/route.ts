import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if profile exists based on role
    let hasProfile = false;
    
    if (user.role === "TEACHER") {
      hasProfile = !!user.teacherProfile;
    } else if (user.role === "STUDENT") {
      hasProfile = !!user.studentProfile;
    } else if (user.role === "ADMIN") {
      hasProfile = true; // Admins don't need profiles
    }

    return NextResponse.json({
      hasProfile,
      role: user.role,
    });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile status" },
      { status: 500 }
    );
  }
}
