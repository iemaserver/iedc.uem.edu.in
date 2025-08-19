import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, ApiErrors } from "@/utils/apiAuth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userSession.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Error changing password:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(ApiErrors.INTERNAL_ERROR, { status: 500 });
  }
}
