
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserType } from "@prisma/client";
import { sendVerificationEmail } from "@/utils/mail/sendVarificationMail";
import { NextRequest, NextResponse } from "next/server";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { fullName, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Check LegacyUser table for userType (contains only TEACHER and ADMIN details)
    const legacy = await prisma.legacyUser.findUnique({ where: { email } });
    const userType = legacy?.userType || UserType.STUDENT; // Default to STUDENT if not in legacy

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        userType,
        isVerified: false,
        resetToken: otp,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // Create corresponding Student or Teacher profile based on userType
    if (userType === UserType.STUDENT) {
      await prisma.student.create({
        data: {
          userId: newUser.id,
          section: "A", // Default section - can be updated later in profile
          year: new Date().getFullYear(),
          batch: "2024-28", // Default batch - can be updated later
          department: "Computer Science", // Default department - can be updated later
          rollNumber: `STU${Date.now()}`, // Generate temporary rollNumber
        },
      });
    } else if (userType === UserType.TEACHER) {
      await prisma.teacher.create({
        data: {
          userId: newUser.id,
          affiliation: "University of Engineering & Management",
          designation: "Assistant Professor", // Default designation - can be updated later
          subjectOfInterest: null,
          officialMail: email,
          address: null,
        },
      });
    }

    if (newUser) {
      // Send verification email
      await sendVerificationEmail(newUser.email!, newUser.resetToken!);
    }

    return NextResponse.json({ message: "Signup successful. Please verify your email." }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
