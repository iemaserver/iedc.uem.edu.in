// /api/auth/verify.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ message: "Missing email or OTP code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.verificationCode !== code) {
    return NextResponse.json({ message: "Invalid code or user not found" }, { status: 401 });
  }

  await prisma.user.update({
    where: { email },
    data: { isVerified: true, verificationCode: null },
  });

  return NextResponse.json({ message: "Email verified successfully" });
}
