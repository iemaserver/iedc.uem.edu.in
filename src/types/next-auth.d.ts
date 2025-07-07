import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user:DefaultSession['user']& {
      id: string;
      email: string;
      userType: string;
      image?: string; // Optional field for user profile image
    };
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    userType: string;
    image?: string; // Optional field for user profile image
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    userType: string;
    image?: string; // Optional field for user profile image
  }
}
