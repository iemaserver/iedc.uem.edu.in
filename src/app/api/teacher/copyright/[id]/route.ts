import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Validation schema for copyright update
const updateCopyrightSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  isPublic: z.boolean().optional(),
  
  // Copyright specific fields
  filedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  submittedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  grantedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  // Inventor teacher IDs (many-to-many)
  inventorIds: z.array(z.string()).optional(),
});

// GET - Retrieve a single copyright by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only teachers and admins can access this resource." },
        { status: 403 }
      );
    }

    // Get teacher profile if not admin
    let teacherProfile = null;
    if (session.user.role !== UserRole.ADMIN) {
      teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 404 }
        );
      }
    }

    const whereClause = session.user.role === UserRole.ADMIN
      ? { id }
      : {
          id,
          inventors: {
            some: {
              teacherId: teacherProfile!.id,
            },
          },
        };

    const copyright = await prisma.copyright.findFirst({
      where: whereClause,
      include: {
        inventors: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!copyright) {
      return NextResponse.json(
        { error: "Copyright not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: copyright });
  } catch (error) {
    console.error("Error fetching copyright:", error);
    return NextResponse.json(
      { error: "Failed to fetch copyright" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing copyright
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only teachers and admins can update copyrights." },
        { status: 403 }
      );
    }

    // Get teacher profile if not admin
    let teacherProfile = null;
    if (session.user.role !== UserRole.ADMIN) {
      teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 404 }
        );
      }
    }

    // Verify the copyright exists and user has access
    const whereClause = session.user.role === UserRole.ADMIN
      ? { id }
      : {
          id,
          inventors: {
            some: {
              teacherId: teacherProfile!.id,
            },
          },
        };

    const existingCopyright = await prisma.copyright.findFirst({
      where: whereClause,
    });

    if (!existingCopyright) {
      return NextResponse.json(
        { error: "Copyright not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateCopyrightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title,
      isPublic,
      filedAt,
      submittedAt,
      publishedAt,
      grantedAt,
      inventorIds,
    } = parsed.data;

    // Verify all inventor IDs are valid if provided
    if (inventorIds && inventorIds.length > 0) {
      const teacherProfiles = await prisma.teacherProfile.findMany({
        where: {
          id: {
            in: inventorIds,
          },
        },
      });

      if (teacherProfiles.length !== inventorIds.length) {
        return NextResponse.json(
          { error: "One or more inventor IDs are invalid" },
          { status: 400 }
        );
      }
    }

    // Update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Build update data object
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (filedAt !== undefined) updateData.filedAt = filedAt;
      if (submittedAt !== undefined) updateData.submittedAt = submittedAt;
      if (publishedAt !== undefined) updateData.publishedAt = publishedAt;
      if (grantedAt !== undefined) updateData.grantedAt = grantedAt;

      // Update copyright
      if (Object.keys(updateData).length > 0) {
        await tx.copyright.update({
          where: { id },
          data: updateData,
        });
      }

      // Update inventors if provided
      if (inventorIds) {
        // Delete existing inventors
        await tx.copyrightInventor.deleteMany({
          where: { copyrightId: id },
        });

        // Create new inventors
        if (inventorIds.length > 0) {
          await tx.copyrightInventor.createMany({
            data: inventorIds.map((teacherId, index) => ({
              copyrightId: id,
              teacherId,
              orderIndex: index,
            })),
          });
        }
      }

      // Fetch updated data with relations
      return tx.copyright.findUnique({
        where: { id },
        include: {
          inventors: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
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
    return NextResponse.json(
      { error: "Failed to update copyright" },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete a copyright
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only teachers and admins can delete copyrights." },
        { status: 403 }
      );
    }

    // Get teacher profile if not admin
    let teacherProfile = null;
    if (session.user.role !== UserRole.ADMIN) {
      teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 404 }
        );
      }
    }

    // Verify the copyright exists and user has access
    const whereClause = session.user.role === UserRole.ADMIN
      ? { id }
      : {
          id,
          inventors: {
            some: {
              teacherId: teacherProfile!.id,
            },
          },
        };

    const existingCopyright = await prisma.copyright.findFirst({
      where: whereClause,
    });

    if (!existingCopyright) {
      return NextResponse.json(
        { error: "Copyright not found or access denied" },
        { status: 404 }
      );
    }

    // Hard delete
    await prisma.copyright.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Copyright deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting copyright:", error);
    return NextResponse.json(
      { error: "Failed to delete copyright" },
      { status: 500 }
    );
  }
}
