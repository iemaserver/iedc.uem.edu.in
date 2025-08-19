import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const searchFacultySchema = z.object({
  query: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const department = searchParams.get("department") || "";
    const designation = searchParams.get("designation") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const validatedData = searchFacultySchema.parse({
      query,
      department,
      designation,
      limit,
      offset,
    });

    // Build search conditions
    const searchConditions: any = {
      user: {
        userType: "TEACHER",
      },
    };

    // Add search filters
    if (validatedData.query) {
      searchConditions.OR = [
        {
          user: {
            fullName: {
              contains: validatedData.query,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: validatedData.query,
              mode: "insensitive",
            },
          },
        },
        {
          affiliation: {
            contains: validatedData.query,
            mode: "insensitive",
          },
        },
        {
          subjectOfInterest: {
            contains: validatedData.query,
            mode: "insensitive",
          },
        },
      ];
    }

    if (validatedData.designation) {
      searchConditions.designation = {
        contains: validatedData.designation,
        mode: "insensitive",
      };
    }

    // Fetch faculty members
    const [faculty, total] = await Promise.all([
      prisma.teacher.findMany({
        where: searchConditions,
        include: {
          user: true,
        },
        orderBy: {
          user: {
            fullName: "asc",
          },
        },
        take: validatedData.limit,
        skip: validatedData.offset,
      }),
      prisma.teacher.count({
        where: searchConditions,
      }),
    ]);

    // Transform the data to include research counts
    const transformedFaculty = await Promise.all(
      faculty.map(async (teacher) => {
        // Get research counts manually since nested _count doesn't work as expected
        const [researchWorksCount, advisedPapersCount, advisedProjectsCount] = await Promise.all([
          prisma.researchWork.count({
            where: { uploadedById: teacher.user.id },
          }),
          prisma.researchPaper.count({
            where: {
              facultyAdvisors: {
                some: { id: teacher.user.id },
              },
            },
          }),
          prisma.ongoingProject.count({
            where: {
              facultyAdvisors: {
                some: { id: teacher.user.id },
              },
            },
          }),
        ]);

        return {
          id: teacher.id,
          userId: teacher.userId,
          affiliation: teacher.affiliation,
          designation: teacher.designation,
          subjectOfInterest: teacher.subjectOfInterest,
          officialMail: teacher.officialMail,
          address: teacher.address,
          user: teacher.user,
          researchStats: {
            researchWorks: researchWorksCount,
            advisedPapers: advisedPapersCount,
            advisedProjects: advisedProjectsCount,
          },
        };
      })
    );

    return NextResponse.json({
      faculty: transformedFaculty,
      pagination: {
        total,
        limit: validatedData.limit,
        offset: validatedData.offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error searching faculty:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
