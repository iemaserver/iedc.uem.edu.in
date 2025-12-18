import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch current user's profile with all their work
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Fetch user with basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profileData: any = { ...user };

    // Fetch role-specific profile and work
    if (userRole === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
          researchPapers: {
            include: {
              reviewedBy: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
              members: {
                include: {
                  member: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          ongoingProjects: {
            include: {
              advisors: {
                include: {
                  advisor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
              members: {
                include: {
                  member: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      // Count achievements
      const achievementsCount = await prisma.achievement.count({
        where: { uploadedById: userId },
      });

      profileData.studentProfile = studentProfile;
      profileData.stats = {
        researchPapers: studentProfile?.researchPapers.length || 0,
        ongoingProjects: studentProfile?.ongoingProjects.length || 0,
        achievements: achievementsCount,
      };
    } else if (userRole === "TEACHER") {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              advisedOngoingProjects: {
                select: {
                  id: true,
                  assignedAt: true,
                  project: {
                    select: {
                      id: true,
                      title: true,
                      abstract: true,
                      status: true,
                      keywords: true,
                      startDate: true,
                      expectedEndDate: true,
                      completedAt: true,
                      createdAt: true,
                      student: {
                        select: {
                          user: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                              image: true,
                            },
                          },
                        },
                      },
                      members: {
                        include: {
                          member: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  assignedAt: "desc",
                },
              },
            },
          },
          _count: {
            select: {
              copyrights: true,
              patents: true,
              transactions: true,
              conferences: true,
              journals: true,
              bookChapters: true,
              grants: true,
              fdps: true,
              certifications: true,
            },
          },
          copyrights: {
            include: {
              copyright: {
                select: {
                  id: true,
                  title: true,
                  createdAt: true,
                  grantedAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              copyright: {
                grantedAt: "desc",
              },
            },
            take: 5,
          },
          patents: {
            include: {
              patent: {
                select: {
                  id: true,
                  title: true,
                  patentNumber: true,
                  grantedAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              patent: {
                grantedAt: "desc",
              },
            },
            take: 5,
          },
          journals: {
            include: {
              journal: {
                select: {
                  id: true,
                  title: true,
                  journalName: true,
                  status: true,
                  statusDate: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              journal: {
                statusDate: "desc",
              },
            },
            take: 5,
          },
          conferences: {
            include: {
              conference: {
                select: {
                  id: true,

                  conferenceName: true,
                  status: true,
                  conferenceStartDate: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              conference: {
                conferenceStartDate: "desc",
              },
            },
            take: 5,
          },
          bookChapters: {
            include: {
              bookChapter: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  isbnIssn: true,
                  registrationFees: true,
                  reimbursement: true,
                  createdAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              bookChapter: {
                createdAt: "desc",
              },
            },
            take: 5,
          },
          transactions: {
            include: {
              transaction: {
                select: {
                  id: true,
                  title: true,
                  transactionName: true,
                  typeOfTransaction: true,
                  indexOfTransaction: true,
                  impactFactor: true,
                  publisher: true,
                  status: true,
                  statusDate: true,
                  createdAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              transaction: {
                statusDate: "desc",
              },
            },
          },
          grants: {
            include: {
              grant: {
                select: {
                  id: true,
                  title: true,
                  projectCode: true,
                  grantAmount: true,
                  durationMonths: true,
                  status: true,
                  grantedAt: true,
                  appliedAt: true,
                  createdAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              grant: {
                grantedAt: "desc",
              },
            },
          },
          fdps: {
            include: {
              fdp: {
                select: {
                  id: true,
                  name: true,
                  organizedBy: true,
                  sponsoredBy: true,
                  duration: true,
                  startDate: true,
                  endDate: true,
                  createdAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              fdp: {
                startDate: "desc",
              },
            },
          },
          certifications: {
            include: {
              certification: {
                select: {
                  id: true,
                  certificationName: true,
                  offeredBy: true,
                  completedAt: true,
                  link: true,
                  createdAt: true,
                  isPublic: true,
                },
              },
            },
            orderBy: {
              certification: {
                completedAt: "desc",
              },
            },
          },
          reviewedPapers: {
            select: {
              id: true,
              title: true,
              abstract: true,
              status: true,
              keywords: true,
              submittedAt: true,
              approvedAt: true,
              publishedAt: true,
              createdAt: true,
              student: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
              members: {
                include: {
                  member: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      // Count achievements and advised works
      const [achievementsCount, advisedPapers, advisedProjects] =
        await Promise.all([
          prisma.achievement.count({
            where: { uploadedById: userId },
          }),
          prisma.researchPaper.count({
            where: { reviewedById: teacherProfile?.id },
          }),
          prisma.ongoingProjectAdvisor.count({
            where: { advisorId: userId },
          }),
        ]);

      profileData.teacherProfile = teacherProfile;
      profileData.stats = {
        copyrights: teacherProfile?._count.copyrights || 0,
        patents: teacherProfile?._count.patents || 0,
        transactions: teacherProfile?._count.transactions || 0,
        conferences: teacherProfile?._count.conferences || 0,
        journals: teacherProfile?._count.journals || 0,
        bookChapters: teacherProfile?._count.bookChapters || 0,
        grants: teacherProfile?._count.grants || 0,
        fdps: teacherProfile?._count.fdps || 0,
        certifications: teacherProfile?._count.certifications || 0,
        achievements: achievementsCount,
        advisedPapers,
        advisedProjects,
      };
    } else if (userRole === "ADMIN") {
      // Fetch system-wide statistics for admin
      const [
        totalUsers,
        totalStudents,
        totalTeachers,
        totalResearchPapers,
        totalOngoingProjects,
        totalAchievements,
        totalCompetitions,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.studentProfile.count(),
        prisma.teacherProfile.count(),
        prisma.researchPaper.count(),
        prisma.ongoingProject.count(),
        prisma.achievement.count(),
        prisma.upcomingCompetition.count(),
      ]);

      profileData.stats = {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalResearchPapers,
        totalOngoingProjects,
        totalAchievements,
        totalCompetitions,
      };
    }

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT: Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await req.json();

    // Update basic user info if provided
    if (body.name || body.image) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.image && { image: body.image }),
        },
      });
    }

    // Update role-specific profile
    if (userRole === "STUDENT" && body.studentProfile) {
      const { studentProfile } = body;
      await prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(studentProfile.rollNumber && {
            rollNumber: studentProfile.rollNumber,
          }),
          ...(studentProfile.enrollmentNumber && {
            enrollmentNumber: studentProfile.enrollmentNumber,
          }),
          ...(studentProfile.year && { year: parseInt(studentProfile.year) }),
          ...(studentProfile.section && { section: studentProfile.section }),
          ...(studentProfile.department && {
            department: studentProfile.department,
          }),
          ...(studentProfile.phoneNumber !== undefined && {
            phoneNumber: studentProfile.phoneNumber,
          }),
          ...(studentProfile.address !== undefined && {
            address: studentProfile.address,
          }),
          ...(studentProfile.bio !== undefined && { bio: studentProfile.bio }),
        },
      });
    } else if (userRole === "TEACHER" && body.teacherProfile) {
      const { teacherProfile } = body;
      await prisma.teacherProfile.update({
        where: { userId },
        data: {
          ...(teacherProfile.department && {
            department: teacherProfile.department,
          }),
          ...(teacherProfile.designation && {
            designation: teacherProfile.designation,
          }),
          ...(teacherProfile.affiliation && {
            affiliation: teacherProfile.affiliation,
          }),
          ...(teacherProfile.phoneNumber !== undefined && {
            phoneNumber: teacherProfile.phoneNumber,
          }),
          ...(teacherProfile.address !== undefined && {
            address: teacherProfile.address,
          }),
          ...(teacherProfile.bio !== undefined && { bio: teacherProfile.bio }),
          ...(teacherProfile.subjectOfInterest && {
            subjectOfInterest: teacherProfile.subjectOfInterest,
          }),
        },
      });
    }

    // Fetch updated user data for session refresh
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
