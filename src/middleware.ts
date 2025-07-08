import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/user',
  '/api/paper',
];

// Define admin-only routes
const adminRoutes = [
  '/dashboard/userlist',
  '/dashboard/achievement',
  '/dashboard/adminpaperwork',
  '/dashboard/OnGoingProject',
  '/dashboard/reviewerlist',
  '/api/user/admin',
];

// Define faculty-only routes
const facultyRoutes = [
  '/dashboard/faculty',
];

// Define student-only routes
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
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, _next, and favicon
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no token, redirect to login
    if (!token) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Check role-based access
    const userType = token.userType as string;

    // Check admin-only routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check faculty-only routes
    if (facultyRoutes.some(route => pathname.startsWith(route))) {
      if (userType !== 'FACULTY' && userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check student-only routes
    if (studentRoutes.some(route => pathname.startsWith(route))) {
      if (userType !== 'STUDENT' && userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check API route permissions
    if (pathname.startsWith('/api/user/admin')) {
      if (userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', token.sub || '');
      requestHeaders.set('x-user-type', userType || '');
      requestHeaders.set('x-user-email', token.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Handle redirect for authenticated users trying to access auth pages
  if (pathname === '/signin' || pathname === '/signup') {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
