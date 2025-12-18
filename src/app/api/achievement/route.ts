import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
  achievedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const isPublished = searchParams.get("isPublished");

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === "true";
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
        orderBy: [
          { achievedAt: "desc" },
          { uploadedAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.achievement.count({ where }),
    ]);

    return NextResponse.json({ 
      data: achievements, 
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
