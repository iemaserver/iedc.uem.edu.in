import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Validation schema for copyright creation
const createCopyrightSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  isPublic: z.boolean().default(false),

  // Copyright specific fields
  filedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  submittedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  publishedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  grantedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  // Inventor teacher IDs (many-to-many)
  inventorIds: z.array(z.string()).min(1, "At least one inventor is required"),
});

// GET - List all copyrights for the authenticated teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is a teacher or admin
    if (
      session.user.role !== UserRole.TEACHER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        {
          error:
            "Access denied. Only teachers and admins can access this resource.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const title = searchParams.get("title");
    const all = searchParams.get("all") === "true";
    const filedAfter = searchParams.get("filedAfter");
    const filedBefore = searchParams.get("filedBefore");
    const submittedAfter = searchParams.get("submittedAfter");
    const submittedBefore = searchParams.get("submittedBefore");
    const publishedAfter = searchParams.get("publishedAfter");
    const publishedBefore = searchParams.get("publishedBefore");
    const grantedAfter = searchParams.get("grantedAfter");
    const grantedBefore = searchParams.get("grantedBefore");
    const isPublic = searchParams.get("isPublic");
    const createdAfter = searchParams.get("createdAfter");
    const createdBefore = searchParams.get("createdBefore");
    const updatedAfter = searchParams.get("updatedAfter");
    const updatedBefore = searchParams.get("updatedBefore");
    const teacherName = searchParams.get("teacherName");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: {
        user: {
          email: session.user.email!,
        },
      },
    });

    if (!teacherProfile && session.user.role !== UserRole.ADMIN) {
      console.log("Teacher profile not found");
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Fetch copyrights - for admin: all, for teacher: only their copyrights
    const where: any =
      session.user.role === UserRole.ADMIN
        ? {}
        : {
            inventors: {
              some: {
                teacherId: teacherProfile!.id,
              },
            },
          };
    if (teacherName) {
      where.inventors = {
        some: {
          teacher: {
            user: {
              name: { contains: teacherName, mode: "insensitive" },
            },
          },
        },
      };
    }

    if (title) where.title = { contains: title, mode: "insensitive" };
    if (isPublic !== null) where.isPublic = isPublic === "true" ? true : false;
    if (filedAfter || filedBefore)
      where.filedAt = {
        ...(filedAfter ? { gte: new Date(filedAfter) } : {}),
        ...(filedBefore ? { lte: new Date(filedBefore) } : {}),
      };
    if (submittedAfter || submittedBefore)
      where.submittedAt = {
        ...(submittedAfter ? { gte: new Date(submittedAfter) } : {}),
        ...(submittedBefore ? { lte: new Date(submittedBefore) } : {}),
      };
    if (publishedAfter || publishedBefore)
      where.publishedAt = {
        ...(publishedAfter ? { gte: new Date(publishedAfter) } : {}),
        ...(publishedBefore ? { lte: new Date(publishedBefore) } : {}),
      };
    if (grantedAfter || grantedBefore)
      where.grantedAt = {
        ...(grantedAfter ? { gte: new Date(grantedAfter) } : {}),
        ...(grantedBefore ? { lte: new Date(grantedBefore) } : {}),
      };
    if (createdAfter || createdBefore)
      where.createdAt = {
        ...(createdAfter ? { gte: new Date(createdAfter) } : {}),
        ...(createdBefore ? { lte: new Date(createdBefore) } : {}),
      };
    if (updatedAfter || updatedBefore)
      where.updatedAt = {
        ...(updatedAfter ? { gte: new Date(updatedAfter) } : {}),
        ...(updatedBefore ? { lte: new Date(updatedBefore) } : {}),
      };

    const orderByField = [
      "filedAt",
      "submittedAt",
      "publishedAt",
      "grantedAt",
      "createdAt",
      "updatedAt",
      "title",
    ].includes(sortBy)
      ? sortBy
      : "createdAt";

    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    const [copyrights, total] = await Promise.all([
      prisma.copyright.findMany({
        where,
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
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { [orderByField]: orderByDirection },
        skip: all ? undefined : (page - 1) * limit,
        take: all ? undefined : limit,
      }),
      prisma.copyright.count({ where }),
    ]);

    return NextResponse.json({
      data: copyrights,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching copyrights:", error);
    return NextResponse.json(
      { error: "Failed to fetch copyrights" },
      { status: 500 }
    );
  }
}

// POST - Create a new copyright
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is a teacher or admin
    if (
      session.user.role !== UserRole.TEACHER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        {
          error:
            "Access denied. Only teachers and admins can create copyrights.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createCopyrightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
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

    // Verify all inventor IDs are valid teacher profiles
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

    // Create copyright with inventors in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create copyright
      const copyright = await tx.copyright.create({
        data: {
          title,
          filedAt,
          submittedAt,
          publishedAt,
          grantedAt,
          isPublic,
        },
      });

      // Create inventor relationships
      await tx.copyrightInventor.createMany({
        data: inventorIds.map((teacherId, index) => ({
          copyrightId: copyright.id,
          teacherId,
          orderIndex: index,
        })),
      });

      // Fetch complete data with relations
      return tx.copyright.findUnique({
        where: { id: copyright.id },
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

    return NextResponse.json(
      {
        message: "Copyright created successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating copyright:", error);
    return NextResponse.json(
      { error: "Failed to create copyright" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids array" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.copyrightInventor.deleteMany({
        where: { copyrightId: { in: ids } },
      });
      await tx.copyright.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
