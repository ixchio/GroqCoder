import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = ["/projects", "/settings"];

// Routes that should redirect TO if authenticated
const authRoutes = ["/auth/signin", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Add current host header
  const headers = new Headers(request.headers);
  headers.set("x-current-host", request.nextUrl.host);

  // Check for session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth routes (optional UX improvement)
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
