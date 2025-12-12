import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const schema = z.object({
  title: z.string().min(3),
  isPublic: z.boolean().default(false),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  grantedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  completedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  durationMonths: z.number().optional(),
  grantAmount: z.number().optional(),
  utilizedAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
  investigators: z
    .array(z.object({ teacherId: z.string(), role: z.string() }))
    .min(1),
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
    const title = searchParams.get("title");
    const isPublic = searchParams.get("isPublic");
    const projectCode = searchParams.get("projectCode");
    const status = searchParams.get("status");
    const projectPI = searchParams.get("projectPI");
    const projectCoPI = searchParams.get("projectCoPI");
    const appliedAtFrom = searchParams.get("appliedAtFrom");
    const appliedAtTo = searchParams.get("appliedAtTo");
    const appliedAt = searchParams.get("appliedAt");
    const grantedAtFrom = searchParams.get("grantedAtFrom");
    const grantedAtTo = searchParams.get("grantedAtTo");
    const grantedAt = searchParams.get("grantedAt");
    const completedAtFrom = searchParams.get("completedAtFrom");
    const completedAtTo = searchParams.get("completedAtTo");
    const completedAt = searchParams.get("completedAt");
    const durationMonthsMin = searchParams.get("durationMonthsMin");
    const durationMonthsMax = searchParams.get("durationMonthsMax");
    const durationMonths = searchParams.get("durationMonths");
    const grantAmountMin = searchParams.get("grantAmountMin");
    const grantAmountMax = searchParams.get("grantAmountMax");
    const grantAmount = searchParams.get("grantAmount");
    const remainingAmountMin = searchParams.get("remainingAmountMin");
    const remainingAmountMax = searchParams.get("remainingAmountMax");
    const remainingAmount = searchParams.get("remainingAmount");
    const publication = searchParams.get("publication");
    const publicationDetails = searchParams.get("publicationDetails");
    const teacherName = searchParams.get("teacherName");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    const where:any =
      session.user.role === UserRole.ADMIN
        ? {}
        : { investigators: { some: { teacherId: teacherProfile?.id } } };

    if (title) where.title = { contains: title, mode: "insensitive" };
    if (isPublic !== null)
      where.isPublic = isPublic === "true" ? true : false;
    if (projectCode) where.projectCode = { contains: projectCode, mode: "insensitive" };
    if (status) where.status = { equals: status, mode: "insensitive" };
    if (projectPI) where.projectPI = { contains: projectPI, mode: "insensitive" };
    if (projectCoPI) where.projectCoPI = { contains: projectCoPI, mode: "insensitive" };
    if (appliedAt) where.appliedAt = new Date(appliedAt);
    if (appliedAtFrom || appliedAtTo) {
      where.appliedAt = {};
      if (appliedAtFrom) where.appliedAt.gte = new Date(appliedAtFrom);
      if (appliedAtTo) where.appliedAt.lte = new Date(appliedAtTo);
    }
    if (grantedAt) where.grantedAt = new Date(grantedAt);
    if (grantedAtFrom || grantedAtTo) {
      where.grantedAt = {};
      if (grantedAtFrom) where.grantedAt.gte = new Date(grantedAtFrom);
      if (grantedAtTo) where.grantedAt.lte = new Date(grantedAtTo);
    }
    if (completedAt) where.completedAt = new Date(completedAt);
    if (completedAtFrom || completedAtTo) {
      where.completedAt = {};
      if (completedAtFrom) where.completedAt.gte = new Date(completedAtFrom);
      if (completedAtTo) where.completedAt.lte = new Date(completedAtTo);
    }
    if (durationMonths) where.durationMonths = Number(durationMonths);
    if (durationMonthsMin || durationMonthsMax) {
      where.durationMonths = {};
      if (durationMonthsMin) where.durationMonths.gte = Number(durationMonthsMin);
      if (durationMonthsMax) where.durationMonths.lte = Number(durationMonthsMax);
    }
    if (grantAmount) where.grantAmount = Number(grantAmount);
    if (grantAmountMin || grantAmountMax) {
      where.grantAmount = {};
      if (grantAmountMin) where.grantAmount.gte = Number(grantAmountMin);
      if (grantAmountMax) where.grantAmount.lte = Number(grantAmountMax);
    }
    if (remainingAmount) where.remainingAmount = Number(remainingAmount);
    if (remainingAmountMin || remainingAmountMax) {
      where.remainingAmount = {};
      if (remainingAmountMin) where.remainingAmount.gte = Number(remainingAmountMin);
      if (remainingAmountMax) where.remainingAmount.lte = Number(remainingAmountMax);
    }
    if (publication) where.publication = { contains: publication, mode: "insensitive" };
    if (publicationDetails) where.publicationDetails = { contains: publicationDetails, mode: "insensitive" };
    if (teacherName) {
      where.investigators = {
        some: {
          teacher: {
            user: { name: { contains: teacherName, mode: "insensitive" } },
          },
        },
      };
    }
    
    const [grants, total] = await Promise.all([
      prisma.grantIn.findMany({
        where,
        include: {
          investigators: {
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
        orderBy: { [sortBy]: sortOrder },
        skip: all ? undefined : (page - 1) * limit,
        take: all ? undefined : limit,
      }),
      prisma.grantIn.count({ where }),
    ]);

    return NextResponse.json({
      data: grants,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

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

    const { investigators, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const grant = await tx.grantIn.create({ data });
      await tx.grantInvestigator.createMany({
        data: investigators.map((inv, index) => ({
          grantId: grant.id,
          teacherId: inv.teacherId,
          role: inv.role,
          orderIndex: index,
        })),
      });
      return tx.grantIn.findUnique({
        where: { id: grant.id },
        include: {
          investigators: {
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

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam)
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    const ids = idsParam.split(",").map((id) => id.trim());
    if (ids.length === 0)
      return NextResponse.json({ error: "No valid IDs" }, { status: 400 });

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (session.user.role !== UserRole.ADMIN && teacherProfile) {
      const grants = await prisma.grantIn.findMany({
        where: {
          id: { in: ids },
          investigators: { some: { teacherId: teacherProfile.id } },
        },
        select: { id: true },
      });
      const validIds = grants.map((g) => g.id);
      if (validIds.length === 0)
        return NextResponse.json(
          { error: "Unauthorized to delete these grants" },
          { status: 403 }
        );

      await prisma.$transaction(async (tx) => {
        await tx.grantInvestigator.deleteMany({
          where: { grantId: { in: validIds } },
        });
        await tx.grantIn.deleteMany({ where: { id: { in: validIds } } });
      });
      return NextResponse.json(
        {
          message: `Deleted ${validIds.length} grants`,
          count: validIds.length,
        },
        { status: 200 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.grantInvestigator.deleteMany({
        where: { grantId: { in: ids } },
      });
      await tx.grantIn.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json(
      { message: `Deleted ${ids.length} grants`, count: ids.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete grants" },
      { status: 500 }
    );
  }
}
