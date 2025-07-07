import prisma from "@/lib/prisma";
import { PaperStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const searchQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

// ─────────────────────────────────────────────
// GET: Fetch multiple papers with search + pagination
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { query, page, limit } = searchQuerySchema.parse(searchParams);
    const skip = (page - 1) * limit;

    const where: any = query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { keywords: { has: query } },
            { id: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

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
    console.error("GET /api/papers error:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 400 });
  }
}

// ─────────────────────────────────────────────
// POST: Create a new research paper
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      abstract,
      filePath,
      keywords,
      authorNames,
      facultyAdvisorNames,
      reviewerName,
      reviewerEmail,
    } = body;

    if (!title || !abstract || !filePath || !Array.isArray(keywords) || !Array.isArray(authorNames)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const paper = await prisma.$transaction(async (prisma) => {
      const authors = await prisma.user.findMany({
        where: { name: { in: authorNames } },
        select: { id: true },
      });

      if (authors.length !== authorNames.length) {
        throw new Error("One or more authors not found");
      }

      const facultyAdvisors = await prisma.user.findMany({
        where: { name: { in: facultyAdvisorNames || [] } },
        select: { id: true },
      });

      let reviewer = null;
      if (reviewerName) {
        reviewer = await prisma.user.findUnique({
          where: { name: reviewerName, email: reviewerEmail },
          select: { id: true },
        });

        if (!reviewer) {
          throw new Error("Reviewer not found");
        }
      }

      return await prisma.researchPaper.create({
        data: {
          title,
          abstract,
          filePath,
          keywords,
          author: {
            connect: authors.map((a) => ({ id: a.id })),
          },
          facultyAdvisors: {
            connect: facultyAdvisors.map((f) => ({ id: f.id })),
          },
          reviewer: reviewer ? { connect: { id: reviewer.id } } : undefined,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          facultyAdvisors: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ message: "Paper uploaded successfully", paper }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/papers error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// DELETE: Remove all papers (optional filter by query)
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { paperIds } = body;
    if (!paperIds || !Array.isArray(paperIds)) {
      return NextResponse.json({ error: "Paper id is not an array or did not provided" }, { status: 400 });
    }
    const result = await prisma.researchPaper.deleteMany({
      where: { id: { in: paperIds } }
    });

    return NextResponse.json({ message: `Deleted ${result.count} paper(s)` });
  } catch (error) {
    console.error("DELETE /api/papers error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PUT: Mass update (e.g., assign reviewer/status via paperId)
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { paperId, reviewerName, status } = await req.json();

    if (!paperId || (!reviewerName && !status)) {
      return NextResponse.json({ error: "Missing paper ID or update fields" }, { status: 400 });
    }

    const updateData: any = {};

    if (reviewerName) {
      const reviewer = await prisma.user.findFirst({
        where: { name: { equals: reviewerName, mode: "insensitive" } },
        select: { id: true },
      });

      if (!reviewer) {
        return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
      }

      updateData.reviewer = { connect: { id: reviewer.id } };
    }

    if (status) {
      const validStatuses = Object.values(PaperStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = status;
    }

    const updatedPaper = await prisma.researchPaper.update({
      where: { id: paperId },
      data: updateData,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ message: "Paper updated successfully", paper: updatedPaper });
  } catch (error) {
    console.error("PUT /api/papers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
