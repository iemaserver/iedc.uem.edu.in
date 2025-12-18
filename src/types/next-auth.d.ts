// types/next-auth.d.ts
import NextAuth from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: UserRole;
      needsProfile?: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    image: string;
    role: UserRole;
    needsProfile?: boolean;
  }
}
