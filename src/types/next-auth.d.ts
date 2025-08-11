// types/next-auth.d.ts
import NextAuth from "next-auth";
import { UserType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      fullName: string;
      email: string;
      image: string;
      userType: UserType;
    };
  }

  interface User {
    id: string;
    fullName: string;
    email: string;
    image: string;
    userType: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    fullName: string;
    email: string;
    image: string;
    userType: UserType;
  }
}
