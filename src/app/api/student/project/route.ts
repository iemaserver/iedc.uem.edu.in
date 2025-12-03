import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole, SubmissionStatus } from "@prisma/client";

const schema = z.object({
  title: z.string().min(3),
  abstract: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expectedEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  advisorIds: z.array(z.string()).optional().default([]),
  memberIds: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
    const isStudent = session.user.role === UserRole.STUDENT && studentProfile;
    
    const where = session.user.role === UserRole.ADMIN 
      ? {} 
      : isStudent 
        ? { studentId: studentProfile.id }
        : { status: SubmissionStatus.PUBLISHED };

    const [projects, total] = await Promise.all([
      prisma.ongoingProject.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true, role: true },
              },
            },
          },
          advisors: {
            include: {
              advisor: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          members: {
            include: {
              member: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ongoingProject.count({ where }),
    ]);

    return NextResponse.json({ data: projects, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: "Only students can create projects" }, { status: 403 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { advisorIds, memberIds, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.ongoingProject.create({
        data: {
          ...data,
          studentId: studentProfile.id,
          status: SubmissionStatus.DRAFT,
        },
      });

      if (advisorIds.length > 0) {
        await tx.ongoingProjectAdvisor.createMany({
          data: advisorIds.map(advisorId => ({ projectId: project.id, advisorId })),
        });
      }

      if (memberIds.length > 0) {
        await tx.ongoingProjectMember.createMany({
          data: memberIds.map(memberId => ({ projectId: project.id, memberId })),
        });
      }

      return tx.ongoingProject.findUnique({
        where: { id: project.id },
        include: {
          student: { include: { user: { select: { id: true, name: true, email: true } } } },
          advisors: { include: { advisor: { select: { id: true, name: true, email: true } } } },
          members: { include: { member: { select: { id: true, name: true, email: true } } } },
        },
      });
    });

    return NextResponse.json({ message: "Created", data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
