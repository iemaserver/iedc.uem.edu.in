import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updatePatentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  
  applicant: z.string().optional(),
  applicationNo: z.string().optional(),
  patentNumber: z.string().optional(),
  
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  publicationLink: z.string().optional(),
  patentLink: z.string().optional(),
  country: z.string().optional(),
  
  inventorIds: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const {id} = await params;

    const body = await req.json();
    const parsed = updatePatentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { inventorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const patent = await tx.patent.update({ where: { id }, data });

      if (inventorIds) {
        await tx.patentInventor.deleteMany({ where: { patentId: id } });
        await tx.patentInventor.createMany({
          data: inventorIds.map((teacherId, index) => ({ patentId: id, teacherId, orderIndex: index })),
        });
      }

      return tx.patent.findUnique({
        where: { id },
        include: {
          inventors: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ message: "Patent updated successfully", data: result });
  } catch (error) {
    console.error("Error updating patent:", error);
    return NextResponse.json({ error: "Failed to update patent" }, { status: 500 });
  }
}
