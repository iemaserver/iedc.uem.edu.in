import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const studentProfileSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required"),
  enrollmentNumber: z.string().optional(),
  year: z.number().min(1).max(4),
  section: z.string().min(1, "Section is required"),
  department: z.string().min(1, "Department is required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can create student profiles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = studentProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 400 }
      );
    }

    // Create student profile
    const profile = await prisma.studentProfile.create({
      data: {
        userId: session.user.id,
        rollNumber: data.rollNumber,
        enrollmentNumber: data.enrollmentNumber || data.rollNumber,
        year: data.year,
        section: data.section,
        department: data.department,
        phoneNumber: data.phoneNumber,
        address: data.address,
        bio: data.bio,
      },
    });

    return NextResponse.json(
      { message: "Profile created successfully", profile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create student profile error:", error);
    
    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Roll number or enrollment number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
