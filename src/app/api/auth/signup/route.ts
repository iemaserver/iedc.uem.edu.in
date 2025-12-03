import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { sendVerificationEmail } from "@/utils/mail/sendVarificationMail";
import { determineUserRole, createUserWithProfile } from "@/lib/createUserProfile";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Determine user role from FacultyUser table
    const userRole = await determineUserRole(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create user with appropriate role and profile in a single transaction
    const newUser = await createUserWithProfile({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      emailVerified: null,
      passwordResetToken: otp,
      passwordResetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
    });

    // Send verification email
    await sendVerificationEmail(newUser.email, otp);

    return NextResponse.json(
      { 
        message: "Signup successful. Please verify your email. Profile created.",
        role: userRole 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
