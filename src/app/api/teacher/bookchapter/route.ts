import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const schema = z.object({
  title: z.string().min(3),
  status: z.nativeEnum(PublicationStatus),
  isbnIssn: z.string().optional(),
  registrationFees: z.number().optional(),
  reimbursement: z.number().int().optional(),
  isPublic: z.boolean().default(false),
  authorIds: z.array(z.string()).min(1),
});
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const all = searchParams.get("all") === "true";
    
    // Filter parameters
    const isPublic = searchParams.get("isPublic");
    const title = searchParams.get("title");
    const status = searchParams.get("status");
    const isbnIssn = searchParams.get("isbnIssn");
    const minFees = searchParams.get("minFees");
    const maxFees = searchParams.get("maxFees");
    
    // Teacher name filter (comma-separated names)
    const teacherNames = searchParams.get("teacherName");
    const teacherNameArray = teacherNames ? teacherNames.split(",").map(name => name.trim()) : undefined;
    
    // Date range filters
    const createdAfter = searchParams.get("createdAfter");
    const createdBefore = searchParams.get("createdBefore");
    const updatedAfter = searchParams.get("updatedAfter");
    const updatedBefore = searchParams.get("updatedBefore");
    
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Build where clause
    const where: any =
      session.user.role === UserRole.ADMIN
        ? {}
        : { authors: { some: { teacherId: teacherProfile?.id } } };

    // Add filters
    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === "true";
    }

    if (title) {
      where.title = { contains: title, mode: "insensitive" };
    }

    if (status && Object.values(PublicationStatus).includes(status as any)) {
      where.status = status;
    }

    if (isbnIssn) {
      where.isbnIssn = { contains: isbnIssn, mode: "insensitive" };
    }

    if (minFees || maxFees) {
      where.registrationFees = {};
      if (minFees) where.registrationFees.gte = parseFloat(minFees);
      if (maxFees) where.registrationFees.lte = parseFloat(maxFees);
    }

    // Date range filters for createdAt
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) {
        where.createdAt.gte = new Date(createdAfter);
      }
      if (createdBefore) {
        where.createdAt.lte = new Date(createdBefore);
      }
    }

    // Date range filters for updatedAt
    if (updatedAfter || updatedBefore) {
      where.updatedAt = {};
      if (updatedAfter) {
        where.updatedAt.gte = new Date(updatedAfter);
      }
      if (updatedBefore) {
        where.updatedAt.lte = new Date(updatedBefore);
      }
    }

   if (teacherNameArray && teacherNameArray.length > 0) {
  where.authors = {
    ...(where.authors || {}),
    some: {
      ...where.authors?.some,
      teacher: {
        user: {
          OR: teacherNameArray.map(name => ({
            name: { contains: name, mode: "insensitive" }
          }))
        }
      }
    },
  };
}

  

    // Dynamic sorting
    const orderByField = ["createdAt", "updatedAt", "title", "registrationFees"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    const [bookChapters, total] = await Promise.all([
      prisma.bookChapter.findMany({
        where,
        include: {
          authors: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, role: true, image: true },
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
      prisma.bookChapter.count({ where }),
    ]);

    return NextResponse.json({
      data: bookChapters,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("BookChapter fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
{/*

## Complete List of Filters You Can Use

### Basic Filters
1. **`isPublic`** - `?isPublic=true` or `?isPublic=false`
2. **`title`** - `?title=Machine Learning` (partial match, case-insensitive)
3. **`status`** - `?status=PUBLISHED` (ACCEPTED, COMMUNICATED, PUBLISHED)
4. **`isbnIssn`** - `?isbnIssn=978-3` (partial match)

### Numeric Range Filters
5. **`minFees`** - `?minFees=1000` (registration fees greater than or equal)
6. **`maxFees`** - `?maxFees=5000` (registration fees less than or equal)
7. **`reimbursement`** - `?reimbursement=500` (exact match)

### Author Filters
8. **`authors`** - `?authors=teacherId1,teacherId2` (filter by specific teachers)

### Date Filters (add these)
9. **`createdAfter`** - `?createdAfter=2024-01-01`
10. **`createdBefore`** - `?createdBefore=2024-12-31`

### Sorting
11. **`sortBy`** - `?sortBy=title` (createdAt, updatedAt, title, registrationFees)
12. **`sortOrder`** - `?sortOrder=asc` or `desc`

### Example Usage
```
GET /api/bookchapters?page=1&limit=10&isPublic=true&status=PUBLISHED&title=AI&minFees=1000&sortBy=title&sortOrder=asc
*/}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );

    const { authorIds, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const bookChapter = await tx.bookChapter.create({ data });
      await tx.bookChapterAuthor.createMany({
        data: authorIds.map((teacherId, index) => ({
          bookChapterId: bookChapter.id,
          teacherId,
          orderIndex: index,
        })),
      });
      return tx.bookChapter.findUnique({
        where: { id: bookChapter.id },
        include: {
          authors: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, role: true },
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
      { message: "Created", data: result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids array" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.bookChapterAuthor.deleteMany({
        where: { bookChapterId: { in: ids } },
      });
      await tx.bookChapter.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({
      message: "Deleted successfully",
      count: ids.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
