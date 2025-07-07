import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const query = searchParams.get("query") || ""; // name or email
    const userType = searchParams.get("userType") as "STUDENT" | "FACULTY" | "ADMIN" | null;
    const department = searchParams.get("department") || null;
    const isVerified = searchParams.get("isVerified");

    // Build dynamic filters
    const where: any = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        userType ? { userType } : {},
        department ? { department: { contains: department, mode: "insensitive" } } : {},
        isVerified !== null ? { isVerified: isVerified === "true" } : {},
      ],
    };

    // Fetch users + count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// DELETE /api/users → delete all users
export async function DELETE() {
  try {
    await prisma.user.deleteMany(); // ⚠️ deletes all user records
    return NextResponse.json({ message: "All users deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 });
  }
}
