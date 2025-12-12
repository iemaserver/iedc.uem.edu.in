import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Role-based route groups
const protectedRoutes = ["/dashboard", "/api/user", "/api/paper"];
const adminRoutes = [
  "/dashboard/admin",
  "/dashboard/userlist",
  "/dashboard/achievement",
  "/dashboard/adminpaperwork",
  "/dashboard/OnGoingProject",
  "/dashboard/reviewerlist",
  "/api/admin",
];
const facultyRoutes = ["/dashboard/faculty", "/api/teacher"];
const studentRoutes = ["/dashboard/student", "/api/student"];

const publicRoutes = ["/", "/signup", "/verify", "/api/auth", "/api/public"];

// Main controller
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static or auth routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If route is public → allow
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // If not authenticated → redirect to signin
    if (!token) {
      const url = new URL("/signin", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    const role = token.role;

    // Admin-only routes
    if (adminRoutes.some((r) => pathname.startsWith(r))) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Faculty-only
    if (facultyRoutes.some((r) => pathname.startsWith(r))) {
      if (role !== "TEACHER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Student-only
    if (studentRoutes.some((r) => pathname.startsWith(r))) {
      if (role !== "STUDENT" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Add user identity headers to API requests
    if (pathname.startsWith("/api/")) {
      const headers = new Headers(request.headers);
      headers.set("x-user-id", token.sub || "");
      headers.set("x-user-role", role || "");
      headers.set("x-user-email", token.email || "");

      return NextResponse.next({ request: { headers } });
    }
  }

  // Prevent signed-in users from hitting signin/signup
  if (pathname === "/signin" || pathname === "/signup") {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // proxy is triggered on all user routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
