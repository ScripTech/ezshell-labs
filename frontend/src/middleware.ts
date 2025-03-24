import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'


// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard']
const publicRoutes = ["/", "/test"];

const authPublicPages = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req });
  const isAuthenticated = !!token;

  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // Allow access to auth-related paths and static files
  const isAuthPage = authPublicPages.includes(path);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (isAuthPage && !isAuthenticated) {
    return NextResponse.next();
  }

  // redirect to dashboard if authenticated and is in login page
  if (isAuthPage && isAuthenticated) {
    const redirectUrl = new URL("/user/dashboard", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
