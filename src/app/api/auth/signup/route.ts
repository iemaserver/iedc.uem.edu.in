import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserType } from "@prisma/client";
import { sendVerificationEmail } from "@/utils/mail/sendVarificationMail";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  

  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { fullName, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check LegacyUser table for userType
    const legacy = await prisma.legacyUser.findUnique({ where: { email } });
    const userType = legacy?.userType || UserType.STUDENT;

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
    if (newUser){

        // Send verification email
        await sendVerificationEmail(newUser.email!, newUser.resetToken!);
    }

    return res.status(201).json({ message: "Signup successful. Please verify your email." });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
