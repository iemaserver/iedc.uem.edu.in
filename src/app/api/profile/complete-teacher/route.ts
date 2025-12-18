import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const teacherProfileSchema = z.object({
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  affiliation: z.string().min(1, "Affiliation is required"),
  officialEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  subjectOfInterest: z.array(z.string()),
  qualification: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create teacher profiles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = teacherProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if profile already exists
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 400 }
      );
    }

    // Create teacher profile
    const profile = await prisma.teacherProfile.create({
      data: {
        userId: session.user.id,
        department: data.department,
        designation: data.designation,
        affiliation: data.affiliation,
        phoneNumber: data.phoneNumber,
        address: data.address,
        bio: data.bio,
        subjectOfInterest: data.subjectOfInterest,
      },
    });

    return NextResponse.json(
      { message: "Profile created successfully", profile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create teacher profile error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
