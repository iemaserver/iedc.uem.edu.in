import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
];

// Define admin-only routes (admin can access all routes)
const adminRoutes = [
  '/dashboard/admin',
];

// Define faculty-only routes (but admin can access)
const facultyRoutes = [
  '/dashboard/teacher',
];

// Define student-only routes (but admin can access)
const studentRoutes = [
  '/dashboard/student',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signup',
  '/verify',
  '/api/auth',
  '/api/public',
];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/signup', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userType = token.userType as string;

    // Admin can access all routes
    if (userType === 'ADMIN') {
      return NextResponse.next();
    }

    // Check role-specific access for non-admin users
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    const isFacultyRoute = facultyRoutes.some(route => pathname.startsWith(route));
    const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));

    // Restrict non-admin access to admin routes
    if (isAdminRoute && userType !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow faculty to access faculty routes
    if (isFacultyRoute && userType !== 'TEACHER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow students to access student routes
    if (isStudentRoute && userType !== 'STUDENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configure matcher to run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
