import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import type { NextAuthOptions } from "next-auth";
import { comparePassword } from "@/utils/basicUtility/comparePassword";
import { UserRole } from "@prisma/client";
import { ensureUserProfile, determineUserRole } from "@/lib/createUserProfile";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
      async profile(profile) {
        // Determine user role from FacultyUser table
        const userRole = await determineUserRole(profile.email);

        // Return profile data - adapter will handle user creation
        // We'll handle profile creation in the signIn callback
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: userRole,
          emailVerified: new Date(),
        };
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            studentProfile: true,
            teacherProfile: true,
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (!user.password) {
          throw new Error("Please sign in with your OAuth provider");
        }

        const isPasswordValid = await comparePassword(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Determine user role from FacultyUser table
        const userRole = await determineUserRole(credentials.email);

        // Update user role if needed (but don't override ADMIN)
        if (user.role !== userRole && user.role !== UserRole.ADMIN) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: userRole },
          });
        }

        // Always ensure profile exists for non-ADMIN users
        await ensureUserProfile(user.id, userRole, user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          image: user.image ?? "",
          role: userRole,
        };
      }
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Just return true, we'll handle profile creation in jwt callback
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, account }) {
      try {
        // When user first signs in, user object will be present
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.role = user.role;
          token.image = user.image;

          // Determine correct role from FacultyUser table
          const userRole = await determineUserRole(user.email!);
          token.role = userRole;

          // Find the user in database
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: {
              studentProfile: true,
              teacherProfile: true,
            },
          });

          if (dbUser) {
            // Update role if changed (but don't override ADMIN)
            if (dbUser.role !== userRole && dbUser.role !== UserRole.ADMIN) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { role: userRole },
              });
            }

            // Check if profile needs completion (don't auto-create)
            const needsProfile = 
              (userRole === UserRole.TEACHER && !dbUser.teacherProfile) ||
              (userRole === UserRole.STUDENT && !dbUser.studentProfile);
            
            token.needsProfile = needsProfile;
          }
        }
        
        // Re-check faculty role and profile status on each token refresh
        if (token.email && !user) {
          const facultyUser = await prisma.facultyUser.findUnique({
            where: { email: token.email },
          });
          
          if (facultyUser) {
            token.role = facultyUser.role;
          }

          // Re-check if profile completion is still needed
          if (token.id && token.role !== "ADMIN") {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              include: {
                studentProfile: true,
                teacherProfile: true,
              },
            });

            if (dbUser) {
              const needsProfile = 
                (token.role === "TEACHER" && !dbUser.teacherProfile) ||
                (token.role === "STUDENT" && !dbUser.studentProfile);
              
              token.needsProfile = needsProfile;
            }
          }
        }
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return token as-is if there's an error to prevent auth failure
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.image = token.image as string;
        session.user.needsProfile = token.needsProfile as boolean | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signup",
    error: "/signup",
  },
  events: {
    async signIn({ user, account }) {
      // This runs after successful authentication
      console.log("User signed in:", user.email);
    },
  },
};
