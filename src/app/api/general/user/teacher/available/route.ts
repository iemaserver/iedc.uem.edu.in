import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.findUnique({
      where: { email: email, userType: "TEACHER" },
      select: { id: true, email: true, fullName: true }, // just check existence
    });

    if (teacher) {
      return NextResponse.json(teacher, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error checking teacher email:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
