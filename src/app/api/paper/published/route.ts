import prisma from "@/lib/prisma";
import { PaperStatus, ReviewerStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ─────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────
const searchQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  status: z.nativeEnum(PaperStatus).optional(),
  reviewerStatus: z.nativeEnum(ReviewerStatus).optional(),
});

// ─────────────────────────────────────────────
// GET: Fetch published papers with search + pagination
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { query, page, limit, status, reviewerStatus } = searchQuerySchema.parse(searchParams);
    const skip = (page - 1) * limit;

    // Build where clause - only fetch published papers
    const where: any = {
      status: PaperStatus.PUBLISH, // Only published papers
    };
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { abstract: { contains: query, mode: "insensitive" } },
        { keywords: { has: query } },
      ];
    }

    if (reviewerStatus) {
      where.reviewerStatus = reviewerStatus;
    }

    const [papers, total] = await Promise.all([
      prisma.researchPaper.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, email: true } },
          facultyAdvisors: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submissionDate: "desc" },
      }),
      prisma.researchPaper.count({ where }),
    ]);

    return NextResponse.json({
      data: papers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/paper/published error:", error);
    return NextResponse.json({ error: "Failed to fetch published papers" }, { status: 500 });
  }
}
