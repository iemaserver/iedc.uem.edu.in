import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PublicationStatus } from "@prisma/client";

const updateSchema = z.object({
  isPublic: z.boolean().optional(),
  conferenceName: z.string().optional(),
  mode: z.string().optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  location: z.string().optional(),
  conferenceStartDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  conferenceEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  paperLinkDOI: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  authorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const conference = await prisma.conference.findFirst({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    if (!conference) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: conference });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const { authorIds, ...updateData } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) await tx.conference.update({ where: { id }, data: updateData });
      if (authorIds) {
        await tx.conferenceAuthor.deleteMany({ where: { conferenceId: id } });
        if (authorIds.length > 0) await tx.conferenceAuthor.createMany({ data: authorIds.map((teacherId, index) => ({ conferenceId: id, teacherId, orderIndex: index })) });
      }
      return tx.conference.findUnique({ where: { id }, include: { authors: { include: { teacher: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } }, orderBy: { orderIndex: "asc" } } } });
    });
    return NextResponse.json({ message: "Updated successfully", data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.conference.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
