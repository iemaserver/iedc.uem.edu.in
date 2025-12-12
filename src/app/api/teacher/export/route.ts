import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Export all research works for the logged-in teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a teacher
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can access this endpoint" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // copyright, patent, journal, conference, etc.

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    let data: any[] = [];

    switch (type) {
      case "copyrights":
        const copyrights = await prisma.copyright.findMany({
          where: {
            inventors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            inventors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = copyrights;
        break;

      case "patents":
        const patents = await prisma.patent.findMany({
          where: {
            inventors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            inventors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = patents;
        break;

      case "journals":
        const journals = await prisma.journal.findMany({
          where: {
            authors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            authors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = journals;
        break;

      case "conferences":
        const conferences = await prisma.conference.findMany({
          where: {
            authors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            authors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = conferences;
        break;

      case "transactions":
        const transactions = await prisma.transaction.findMany({
          where: {
            authors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            authors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = transactions;
        break;

      case "bookchapters":
        const bookChapters = await prisma.bookChapter.findMany({
          where: {
            authors: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            authors: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = bookChapters;
        break;

      case "grants":
        const grants = await prisma.grantIn.findMany({
          where: {
            investigators: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            investigators: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = grants;
        break;

      case "fdps":
        const fdps = await prisma.fDP.findMany({
          where: {
            participants: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            participants: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = fdps;
        break;

      case "certifications":
        const certifications = await prisma.certification.findMany({
          where: {
            holders: {
              some: { teacherId: teacherProfile.id },
            },
          },
          include: {
            holders: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        data = certifications;
        break;

      case "all":
        // Fetch all data types
        const allData = await Promise.all([
          prisma.copyright.findMany({
            where: { inventors: { some: { teacherId: teacherProfile.id } } },
            include: { inventors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.patent.findMany({
            where: { inventors: { some: { teacherId: teacherProfile.id } } },
            include: { inventors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.journal.findMany({
            where: { authors: { some: { teacherId: teacherProfile.id } } },
            include: { authors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.conference.findMany({
            where: { authors: { some: { teacherId: teacherProfile.id } } },
            include: { authors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.transaction.findMany({
            where: { authors: { some: { teacherId: teacherProfile.id } } },
            include: { authors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.bookChapter.findMany({
            where: { authors: { some: { teacherId: teacherProfile.id } } },
            include: { authors: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.grantIn.findMany({
            where: { investigators: { some: { teacherId: teacherProfile.id } } },
            include: { investigators: { include: { teacher: { include: { user: true } } }, orderBy: { orderIndex: "asc" } } },
          }),
          prisma.fDP.findMany({
            where: { participants: { some: { teacherId: teacherProfile.id } } },
            include: { participants: { include: { teacher: { include: { user: true } } } } },
          }),
          prisma.certification.findMany({
            where: { holders: { some: { teacherId: teacherProfile.id } } },
            include: { holders: { include: { teacher: { include: { user: true } } } } },
          }),
        ]);

        return NextResponse.json({
          copyrights: allData[0],
          patents: allData[1],
          journals: allData[2],
          conferences: allData[3],
          transactions: allData[4],
          bookChapters: allData[5],
          grants: allData[6],
          fdps: allData[7],
          certifications: allData[8],
          teacherInfo: {
            name: teacherProfile.user.name,
            email: teacherProfile.user.email,
            department: teacherProfile.department,
            designation: teacherProfile.designation,
            affiliation: teacherProfile.affiliation,
          },
        });

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: copyrights, patents, journals, conferences, transactions, bookchapters, grants, fdps, certifications, or all" },
          { status: 400 }
        );
    }

    return NextResponse.json({ data, type });
  } catch (error) {
    console.error("Error exporting teacher data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
