import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// ----- Zod Schemas -----
const legacyUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  userType: z.enum(["ADMIN", "TEACHER"]),
});

const legacyUserUpdateSchema = legacyUserSchema.partial();

// ----- CREATE -----
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = legacyUserSchema.parse(body);

    const user = await prisma.legacyUser.create({
      data: validatedData,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ----- READ ALL WITH PAGINATION + SEARCH -----
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const q = searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = (searchParams.get("order") || "desc").toLowerCase() as
      | "asc"
      | "desc";

    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { fullName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.legacyUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.legacyUser.count({ where }),
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// ----- UPDATE -----
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const validatedData = legacyUserUpdateSchema.parse(rest);

    const updatedUser = await prisma.legacyUser.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----- DELETE -----
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.legacyUser.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
