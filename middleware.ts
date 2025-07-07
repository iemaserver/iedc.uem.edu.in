import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes for different user types
const protectedRoutes = {
  admin: [
    '/dashboard/userlist',
    '/dashboard/achievement',
    '/dashboard/adminpaperwork',
    '/dashboard/OnGoingProject',
    '/dashboard/reviewerlist',
  ],
  faculty: [
    '/dashboard/paper',
    '/dashboard/project',
  ],
  student: [
    '/dashboard/student',
  ],
  authenticated: [
    '/dashboard',
    '/dashboard/profile',
  ],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signup',
  '/verify',
  '/api/auth',
  '/api/paper/researchPaper', // Public endpoint for viewing published papers
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/user',
  '/api/paper/ongoingProject',
  '/api/paper/researchPaper', // Protected for CRUD operations
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes and static files
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token) {
    // Redirect to signin for protected routes
    if (pathname.startsWith('/dashboard') || 
        protectedApiRoutes.some(route => pathname.startsWith(route))) {
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // Return 401 for API routes
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return NextResponse.next();
  }

  // User is authenticated, check role-based access
  const userType = token.userType as string;
  
  // Check admin routes
  if (protectedRoutes.admin.some(route => pathname.startsWith(route))) {
    if (userType !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Check faculty routes
  if (protectedRoutes.faculty.some(route => pathname.startsWith(route))) {
    if (userType !== 'FACULTY' && userType !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Faculty access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Check student routes
  if (protectedRoutes.student.some(route => pathname.startsWith(route))) {
    if (userType !== 'STUDENT' && userType !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Student access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // API route protection
  if (pathname.startsWith('/api/user/admin/')) {
    if (userType !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Rate limiting for API routes (basic implementation)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  // Add user info to headers for API routes
  if (pathname.startsWith('/api/') && token) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
