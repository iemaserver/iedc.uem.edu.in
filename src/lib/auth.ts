import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { UserType } from "@prisma/client";
import { comparePassword } from "@/utils/basicUtility/comparePassword";

// A robust way to ensure the prisma client is always available
import prisma from "@/lib/prisma";

const CustomAdapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: any) => {
    const { emailVerified, ...rest } = data;
    const newUser = await prisma.user.create({ data: rest });
    
    // Create corresponding Student or Teacher profile for new users
    if (newUser.userType === "STUDENT") {
      await prisma.student.create({
        data: {
          userId: newUser.id,
          section: "A",
          year: new Date().getFullYear(),
          batch: "2024-28",
          department: "Computer Science",
          rollNumber: `STU${Date.now()}`,
        },
      });
    } else if (newUser.userType === "TEACHER") {
      await prisma.teacher.create({
        data: {
          userId: newUser.id,
          affiliation: "University of Engineering & Management",
          designation: "Assistant Professor",
          subjectOfInterest: null,
          officialMail: newUser.email,
          address: null,
        },
      });
    }
    
    return newUser;
  }
};


export const authOptions: NextAuthOptions = {
  adapter: CustomAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          fullName: profile.name,
          image: profile.picture,
          userType: "STUDENT",
          isVerified: true,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !(await comparePassword(credentials.password, user.password!))) {
          throw new Error("Invalid credentials");
        }

        const legacyUser = await prisma.legacyUser.findUnique({
          where: { email: credentials.email },
        });

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { userType: legacyUser?.userType ?? "STUDENT" }, // Default to STUDENT if not in legacy
        });

        // Check and create Student/Teacher profile if it doesn't exist
        if (updatedUser.userType === "STUDENT") {
          const studentProfile = await prisma.student.findUnique({ where: { userId: updatedUser.id } });
          if (!studentProfile) {
            await prisma.student.create({
              data: {
                userId: updatedUser.id,
                section: "A",
                year: new Date().getFullYear(),
                batch: "2024-28",
                department: "Computer Science",
                rollNumber: `STU${Date.now()}`,
              },
            });
          }
        } else if (updatedUser.userType === "TEACHER") {
          const teacherProfile = await prisma.teacher.findUnique({ where: { userId: updatedUser.id } });
          if (!teacherProfile) {
            await prisma.teacher.create({
              data: {
                userId: updatedUser.id,
                affiliation: "University of Engineering & Management",
                designation: "Assistant Professor",
                subjectOfInterest: null,
                officialMail: updatedUser.email,
                address: null,
              },
            });
          }
        }

        return {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email ?? "",
          image: updatedUser.image ?? "",
          userType: updatedUser.userType,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        
        if (existingUser) {
          const legacyUser = await prisma.legacyUser.findUnique({ where: { email: user.email } });
          const newRole = legacyUser?.userType ?? existingUser.userType ?? "STUDENT"; // Default to STUDENT if not in legacy
          const fullName = legacyUser?.fullName ?? existingUser.fullName ?? user.fullName ?? "Default-name";

          if (newRole !== existingUser.userType) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { userType: newRole, fullName: fullName },
            });
          }

          // Check and create Student/Teacher profile if it doesn't exist
          if (newRole === "STUDENT") {
            const studentProfile = await prisma.student.findUnique({ where: { userId: existingUser.id } });
            if (!studentProfile) {
              await prisma.student.create({
                data: {
                  userId: existingUser.id,
                  section: "A",
                  year: new Date().getFullYear(),
                  batch: "2024-28",
                  department: "Computer Science",
                  rollNumber: `STU${Date.now()}`,
                },
              });
            }
          } else if (newRole === "TEACHER") {
            const teacherProfile = await prisma.teacher.findUnique({ where: { userId: existingUser.id } });
            if (!teacherProfile) {
              await prisma.teacher.create({
                data: {
                  userId: existingUser.id,
                  affiliation: "University of Engineering & Management",
                  designation: "Assistant Professor",
                  subjectOfInterest: null,
                  officialMail: user.email,
                  address: null,
                },
              });
            }
          }

          user.userType = newRole;
          user.id = existingUser.id; // Ensure the user object has the correct DB id
        } else {
          // This block runs for brand new Google sign-ins.
          // Check if email exists in LegacyUser (TEACHER/ADMIN) or default to STUDENT
          const legacyUser = await prisma.legacyUser.findUnique({ where: { email: user.email } });
          user.userType = legacyUser?.userType ?? "STUDENT";
          // We can't access user.id here yet, it's created later.
          // The adapter's createUser will handle the initial creation with this user object.
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.email = user.email;
        token.userType = (user as any).userType; // Cast to 'any' to access userType
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fullName = token.fullName as string;
        session.user.email = token.email as string;
        session.user.userType = token.userType as UserType;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};