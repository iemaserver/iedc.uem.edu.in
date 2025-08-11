import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import type { NextAuthOptions } from "next-auth";
import { comparePassword } from "@/utils/basicUtility/comparePassword";
import { UserType } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        // Check LegacyUser before creating/updating
        const legacyUser = await prisma.legacyUser.findUnique({
          where: { email: profile.email },
        });

        return {
          id: profile.sub,
          email: profile.email,
          fullName: legacyUser ? legacyUser.fullName : profile.name,
          image: profile.picture,
          userType: legacyUser ? legacyUser.userType : "STUDENT",
          isVerified: true, // For Google auth
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
  });

  if (!user || !(await comparePassword(credentials.password, user.password!))) {
    throw new Error("Invalid credentials");
  }

  // Check LegacyUser model for role
  const legacyUser = await prisma.legacyUser.findUnique({
    where: { email: credentials.email },
  });

  if (legacyUser) {
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: legacyUser.userType },
    });
    user.userType = legacyUser.userType;
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: "STUDENT" },
    });
    user.userType = "STUDENT";
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email ?? "",
    image: user.image ?? "",
    userType: user.userType,
  };
}

    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.email = user.email;
        token.userType = user.userType;
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
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
