import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const updateJournalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  
  journalName: z.string().optional(),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publisher: z.string().optional(),
  issn: z.string().optional(),
  volumeNumber: z.string().optional(),
  issueNumber: z.string().optional(),
  pageNumbers: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  paperLinkDOI: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  authorIds: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const {id} = await params;

    const body = await req.json();
    const parsed = updateJournalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { authorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const journal = await tx.journal.update({ where: { id }, data });

      if (authorIds) {
        await tx.journalAuthor.deleteMany({ where: { journalId: id } });
        await tx.journalAuthor.createMany({
          data: authorIds.map((teacherId, index) => ({ journalId: id, teacherId, orderIndex: index })),
        });
      }

      return tx.journal.findUnique({
        where: { id },
        include: {
          authors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Journal updated successfully", data: result });
  } catch (error) {
    console.error("Error updating journal:", error);
    return NextResponse.json({ error: "Failed to update journal" }, { status: 500 });
  }
}
