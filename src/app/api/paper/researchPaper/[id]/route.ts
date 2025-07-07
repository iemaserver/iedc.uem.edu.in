import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { PaperStatus, ReviewerStatus } from "@prisma/client";
import { z } from "zod";

const idSchema = z.string().uuid("Invalid paper ID format");

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);
    const paper = await prisma.researchPaper.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json({ paper });
  } catch (error) {
    console.error("GET /api/paper/[id] error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);
    const body = await req.json();
    const { title, abstract, filePath, keywords, status, reviewerStatus } = body;

    const updateData: any = {};
    if (reviewerStatus && Object.values(ReviewerStatus).includes(reviewerStatus)) {
      updateData.reviewerStatus = reviewerStatus;
    }
    if (title) updateData.title = title;
    if (abstract) updateData.abstract = abstract;
    if (filePath) updateData.filePath = filePath;
    if (Array.isArray(keywords)) updateData.keywords = keywords;
    if (status && Object.values(PaperStatus).includes(status)) updateData.status = status;

    const updatedPaper = await prisma.researchPaper.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        facultyAdvisors: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ message: "Paper updated", paper: updatedPaper });
  } catch (error) {
    console.error("PUT /api/paper/[id] error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id);

    const deletedPaper = await prisma.researchPaper.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Paper deleted", paper: deletedPaper });
  } catch (error) {
    console.error("DELETE /api/paper/[id] error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
