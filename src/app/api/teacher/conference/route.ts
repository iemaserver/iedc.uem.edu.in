import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, PublicationStatus } from "@prisma/client";

const createConferenceSchema = z.object({
  isPublic: z.boolean().default(false),
  conferenceName: z.string().min(1),
  mode: z.string().optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  location: z.string().optional(),
  conferenceStartDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  conferenceEndDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().transform((val) => new Date(val)),
  paperLinkDOI: z.string().url().optional().or(z.literal("")),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  reimbursementDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
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
    const conferenceName = searchParams.get("conferenceName");
    const mode = searchParams.get("mode");
    const typeOfConference = searchParams.get("typeOfConference");
    const indexOfConference = searchParams.get("indexOfConference");
    const publisher = searchParams.get("publisher");
    const location = searchParams.get("location");
    const status = searchParams.get("status");
    const registrationFeesMin = searchParams.get("registrationFeesMin");
    const registrationFeesMax = searchParams.get("registrationFeesMax");
    const registrationFees = searchParams.get("registrationFees");
    const reimbursementStatus = searchParams.get("reimbursementStatus");
    const isPublic = searchParams.get("isPublic");
    const teacherName = searchParams.get("teacherName");

    // Date range filters
    const createdAfter = searchParams.get("createdAfter");
    const createdBefore = searchParams.get("createdBefore");
    const updatedAfter = searchParams.get("updatedAfter");
    const updatedBefore = searchParams.get("updatedBefore");
    const conferenceStartAfter = searchParams.get("conferenceStartAfter");
    const conferenceStartBefore = searchParams.get("conferenceStartBefore");
    const conferenceEndAfter = searchParams.get("conferenceEndAfter");
    const conferenceEndBefore = searchParams.get("conferenceEndBefore");


    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    const where:any =
      session.user.role === UserRole.ADMIN
        ? {}
        : { authors: { some: { teacherId: teacherProfile?.id } } };

    // Add filters
    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === "true";
    }
    if (teacherName) {
      where.authors = {
        some: {
          teacher: {
            user: {
              name: {
                contains: teacherName,
                mode: "insensitive",
              },
            },
          },
        },
      };
    }
    if (conferenceName) {
      where.conferenceName = {
        contains: conferenceName,
        mode: "insensitive",
      };
    }
    if (mode) {
      where.mode = { contains: mode, mode: "insensitive" };
    }
    if (typeOfConference) {
      where.typeOfConference = {
        contains: typeOfConference,
        mode: "insensitive",
      };
    }
    if (indexOfConference) {
      where.indexOfConference = {
        contains: indexOfConference,
        mode: "insensitive",
      };
    }
    if (publisher) {
      where.publisher = { contains: publisher, mode: "insensitive" };
    }
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (status && Object.values(PublicationStatus).includes(status as PublicationStatus)) {
      where.status = status;
    }
    if (reimbursementStatus){
      where.reimbursementStatus = { contains: reimbursementStatus, mode: "insensitive" };
    }
    if (registrationFeesMin || registrationFeesMax || registrationFees) {
      where.registrationFees = {};
      if (registrationFees) {
        where.registrationFees.equals = parseFloat(registrationFees);
      }
      if (registrationFeesMin) {
        where.registrationFees.gte = parseFloat(registrationFeesMin);
      }
      if (registrationFeesMax) {
        where.registrationFees.lte = parseFloat(registrationFeesMax);
      }
    }
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }
    if (updatedAfter || updatedBefore) {
      where.updatedAt = {};
      if (updatedAfter) where.updatedAt.gte = new Date(updatedAfter);
      if (updatedBefore) where.updatedAt.lte = new Date(updatedBefore);
    }
    if (conferenceStartAfter || conferenceStartBefore) {
      where.conferenceStartDate = {};
      if (conferenceStartAfter)
        where.conferenceStartDate.gte = new Date(conferenceStartAfter);
      if (conferenceStartBefore)
        where.conferenceStartDate.lte = new Date(conferenceStartBefore);
    }
    if (conferenceEndAfter || conferenceEndBefore) {
      where.conferenceEndDate = {};
      if (conferenceEndAfter)
        where.conferenceEndDate.gte = new Date(conferenceEndAfter);
      if (conferenceEndBefore)
        where.conferenceEndDate.lte = new Date(conferenceEndBefore);
    }
    const orderByField = [
      "createdAt",
      "updatedAt",
      "conferenceName",
      "conferenceStartDate",
      "conferenceEndDate",
    ].includes(sortBy)
      ? sortBy
      : "createdAt";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";


    const [conferences, total] = await Promise.all([
      prisma.conference.findMany({
        where,
        include: {
          authors: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, role: true, image:true },
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
      prisma.conference.count({ where }),
    ]);

    return NextResponse.json({
      data: conferences,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch conferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createConferenceSchema.safeParse(body);
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
      const conference = await tx.conference.create({ data });
      await tx.conferenceAuthor.createMany({
        data: authorIds.map((teacherId, index) => ({
          conferenceId: conference.id,
          teacherId,
          orderIndex: index,
        })),
      });
      return tx.conference.findUnique({
        where: { id: conference.id },
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
      { message: "Conference created successfully", data: result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create conference" },
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
      await tx.conferenceAuthor.deleteMany({
        where: { conferenceId: { in: ids } },
      });
      await tx.conference.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ message: "Deleted", count: ids.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
