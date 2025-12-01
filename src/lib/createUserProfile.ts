import { UserRole } from "@prisma/client";
import prisma from "./prisma";

/**
 * Ensures that the appropriate profile exists for a user based on their role
 * Creates the profile if it doesn't exist
 * This is a centralized function to maintain consistency across auth flows
 */
export async function ensureUserProfile(
  userId: string,
  role: UserRole,
  email: string
): Promise<void> {
  try {
    // Check existing profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      if (role === UserRole.TEACHER && !user.teacherProfile) {
        // Create teacher profile
        await tx.teacherProfile.create({
          data: {
            userId,
            employeeId: `EMP-${Date.now()}`,
            department: "Not Specified",
            designation: "Faculty",
            affiliation: "UEM",
            officialEmail: email,
          },
        });
        console.log(`✅ Teacher profile created for user: ${userId}`);
      } else if (role === UserRole.STUDENT && !user.studentProfile) {
        // Create student profile
        await tx.studentProfile.create({
          data: {
            userId,
            rollNumber: `ROLL-${Date.now()}`,
            batch: new Date().getFullYear().toString(),
            year: 1,
            section: "A",
            department: "Not Specified",
          },
        });
        console.log(`✅ Student profile created for user: ${userId}`);
      } else if (role === UserRole.ADMIN) {
        // Admins don't need profiles
        console.log(`ℹ️  Admin user doesn't require a profile: ${userId}`);
      } else {
        console.log(`ℹ️  Profile already exists for user: ${userId}`);
      }
    });
  } catch (error) {
    console.error("❌ Error ensuring user profile:", error);
    throw error;
  }
}

/**
 * Determines user role based on FacultyUser table
 * Returns STUDENT if not found in faculty table
 */
export async function determineUserRole(email: string): Promise<UserRole> {
  try {
    const facultyUser = await prisma.facultyUser.findUnique({
      where: { email },
    });

    return facultyUser ? facultyUser.role : UserRole.STUDENT;
  } catch (error) {
    console.error("Error determining user role:", error);
    return UserRole.STUDENT; // Default to STUDENT on error
  }
}

/**
 * Creates a new user with appropriate profile in a single transaction
 * Used during signup
 */
export async function createUserWithProfile(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  emailVerified?: Date | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: Date | null;
  image?: string | null;
}) {
  return await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        emailVerified: data.emailVerified ?? null,
        passwordResetToken: data.passwordResetToken ?? null,
        passwordResetTokenExpiry: data.passwordResetTokenExpiry ?? null,
        image: data.image ?? null,
      },
    });

    // Create appropriate profile
    if (data.role === UserRole.TEACHER) {
      await tx.teacherProfile.create({
        data: {
          userId: user.id,
          employeeId: `EMP-${Date.now()}`,
          department: "Not Specified",
          designation: "Faculty",
          affiliation: "UEM",
          officialEmail: data.email,
        },
      });
    } else if (data.role === UserRole.STUDENT) {
      await tx.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber: `ROLL-${Date.now()}`,
          batch: new Date().getFullYear().toString(),
          year: 1,
          section: "A",
          department: "Not Specified",
        },
      });
    }

    return user;
  });
}
