import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Auth routes
    '/login',
    '/signup',
    '/reset-password',
    '/update-password',
    
    // Protected routes
    '/dashboard',
    '/dashboard/:path*',
  ],
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  console.log(`Middleware handling path: ${pathname}`);
  
  // Create a response object that we can modify
  const res = NextResponse.next();
  
  // Create a Supabase client specifically for middleware
  const supabase = createMiddlewareClient({ req, res });
  
  // This will refresh the session if it exists and is expired
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  console.log('Session check in middleware:', session ? 'Session exists' : 'No session');
  
  // Define which routes should be protected
  const protectedRoutes = ['/dashboard'];
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute) {
    // If there's no session, redirect to login
    if (!session) {
      console.log('Redirecting to login from protected route - No session');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('returnTo', pathname);
      redirectUrl.searchParams.set('fresh', 'true');
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check if user has 'driver' role in their metadata or profile
    const userRole = session.user.user_metadata?.role;
    
    if (userRole !== 'driver') {
      // If user doesn't have the right role, fetch from profiles table
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        // If profile exists and doesn't have 'driver' role, log the user out
        if (!profile || profile.role !== 'driver') {
          console.log('Redirecting to login from protected route - Not a driver');
          await supabase.auth.signOut();
          // Add a small delay to ensure session is cleared
          await new Promise(resolve => setTimeout(resolve, 100));
          const redirectUrl = new URL('/login', req.url);
          redirectUrl.searchParams.set('error', 'drivers_only');
          redirectUrl.searchParams.set('fresh', 'true');
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // On error, also redirect to login
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('error', 'server_error');
        redirectUrl.searchParams.set('fresh', 'true');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  // Define auth routes that should redirect to dashboard if user is already logged in
  const authRoutes = ['/login', '/signup', '/reset-password'];
  
  if (authRoutes.includes(pathname) && session) {
    // Check for the 'fresh' flag or logout flag to prevent redirect loops
    const freshLogin = req.nextUrl.searchParams.get('fresh') === 'true';
    const isLogout = req.nextUrl.searchParams.get('logout') === 'true';
    
    if (!freshLogin && !isLogout) {
      console.log('Redirecting to dashboard from auth route');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // For all other cases, return the response with any session cookie updates
  return res;
}