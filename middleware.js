// File: middleware.js
import { NextResponse } from 'next/server';
import { verifyJWT } from './lib/auth/jwt';

export async function middleware(request) {
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Check if the path is one we want to protect
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/learn') ||
    request.nextUrl.pathname.startsWith('/challenges');
  
  // If it's a protected path and no token exists, redirect to login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  // If we have a token, verify it
  if (token) {
    try {
      // Verify token
      await verifyJWT(token);
      
      // If user is on login page but already authenticated, redirect to dashboard
      if (request.nextUrl.pathname === '/auth/signin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // If token is invalid and path is protected, redirect to login
      if (isProtectedPath) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/learn/:path*',
    '/challenges/:path*',
    '/auth/signin',
  ],
};