import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const updateJournalSchema = z.object({
  title: z.string().min(3).optional(),
  isPublic: z.boolean().optional(),
  journalName: z.string().optional(),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  authorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const journal = await prisma.journal.findFirst({
      where: { id },
      include: {
        authors: {
          include: {
            teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    return NextResponse.json({ data: journal });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = updateJournalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { authorIds, ...updateData } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.journal.update({ where: { id }, data: updateData });
      }

      if (authorIds) {
        await tx.journalAuthor.deleteMany({ where: { journalId: id } });
        if (authorIds.length > 0) {
          await tx.journalAuthor.createMany({
            data: authorIds.map((teacherId, index) => ({ journalId: id, teacherId, orderIndex: index })),
          });
        }
      }

      return tx.journal.findUnique({
        where: { id },
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Journal updated successfully", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update journal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.journal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Journal deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete journal" }, { status: 500 });
  }
}
