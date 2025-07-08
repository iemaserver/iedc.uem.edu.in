import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { comparePassword } from "@/utils/basicUtility/comparePassword";
import NextAuth, { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    async authorize(credentials) {
  if (!credentials?.email || !credentials.password) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !user.password) return null;

  const isValid = await comparePassword(
    credentials.password,
    user.password
  );
  if (!isValid || !user.isVerified) return null;

  const userDetails = await prisma.userDetails.findUnique({
    where: { email: credentials.email },
  });

  // Update userType if not already set or differs
  if (userDetails && user.userType !== userDetails.userType) {
    await prisma.user.update({
      where: { email: credentials.email },
      data: {
        userType: userDetails.userType,
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    userType: userDetails?.userType || user.userType || "STUDENT",
    name: user.name,
    image: undefined, // no image for credentials login
  };
}

    }),

    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  debug: process.env.NODE_ENV === "development",

  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // Handle Google login first time
   if (user && account?.provider === "google") {
  if (!user.email) throw new Error("No email from Google");

  let existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  const userDetails = await prisma.userDetails.findUnique({
    where: { email: user.email },
  });

  const userType = userDetails?.userType || "STUDENT";

  if (!existingUser) {
    // Create new user with default or fetched userType
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name?.toLowerCase().trim() || "Unnamed",
        userType,
        isVerified: true,
        profileImage: user.image || null,
      },
    });
    existingUser = newUser;
  } else {
    // Update profile image if changed
    if (user.image && user.image !== existingUser.profileImage) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { profileImage: user.image },
      });
    }

    // Update userType if needed
    if (userDetails && existingUser.userType !== userDetails.userType) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { userType: userDetails.userType },
      });
    }
  }

  // Assign to token
  token.id = existingUser.id;
  token.email = existingUser.email;
  token.name = existingUser.name;
  token.userType = existingUser.userType;
  token.image = user.image || undefined;
}

        // Credentials login
        if (user && account?.provider === "credentials") {
          token.id = user.id;
          token.email = user.email;
          token.userType = (user as any).userType; // Cast user to any to access userType
          token.name = user.name;
          token.image = undefined; // Set image to undefined for credentials login in JWT token
        }

        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        return {
          ...session,
          user: {
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            userType: token.userType as string,
            image: token.image, // Map image from token to session. Can be string or undefined.
          },
        };
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          // Ensure user has email from Google
          if (!user.email) {
            return false;
          }
          return true;
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
  },

  pages: {
    signIn: "/signup",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
