import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendVerificationEmail } from "@/utils/mail/sendVarificationMail";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) return NextResponse.json({ error: "User already exists" }, { status: 400 });

  const hashedPassword = await hash(password, 12);
  const code = crypto.randomInt(100000, 999999).toString(); // 6-digit code

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      verificationCode: code,
      verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  await sendVerificationEmail(email, code);

  return NextResponse.json({ message: "Verification code sent to email." });
}
