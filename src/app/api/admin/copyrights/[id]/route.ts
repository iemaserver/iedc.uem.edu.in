import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateCopyrightSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  
  copyrightNumber: z.string().optional(),
  applicant: z.string().optional(),
  
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  country: z.string().optional(),
  certificateUrl: z.string().optional(),
  
  inventorIds: z.array(z.string()).optional(),
});

// PATCH - Update copyright
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const {id} = await params;

    const body = await req.json();
    const parsed = updateCopyrightSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { inventorIds, ...data } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const copyright = await tx.copyright.update({
        where: { id },
        data,
      });

      if (inventorIds) {
        await tx.copyrightInventor.deleteMany({ where: { copyrightId: id } });
        await tx.copyrightInventor.createMany({
          data: inventorIds.map((teacherId, index) => ({
            copyrightId: id,
            teacherId,
            orderIndex: index,
          })),
        });
      }

      return tx.copyright.findUnique({
        where: { id },
        include: {
          inventors: {
            include: {
              teacher: {
                include: {
                  user: { select: { id: true, name: true, email: true, role: true } },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Copyright updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating copyright:", error);
    return NextResponse.json({ error: "Failed to update copyright" }, { status: 500 });
  }
}
