import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

// Define protected routes that require authentication
const protectedRoutes = [
  '/user',
  '/admin',
  '/dashboard',
  '/ezshell'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/test'
]

// Define exact public routes that require exact match
const exactPublicRoutes = [
  '/'
]

// Define auth-related pages
const authPublicPages = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/auth/setup'
]

// Define admin-only routes
const adminRoutes = [
  '/admin'
]

export default async function middleware(req: NextRequestWithAuth) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    })

    const path = req.nextUrl.pathname
    console.log(`🔍 Middleware checking path: ${path}, token exists: ${!!token}`)

    // Check route types
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route)) || exactPublicRoutes.includes(path)
    const isAuthPage = authPublicPages.some(route => path.startsWith(route))
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

    console.log(`🔍 Route checks - Public: ${isPublicRoute}, Auth: ${isAuthPage}, Protected: ${isProtectedRoute}, Admin: ${isAdminRoute}`)

    // Allow access to completely public routes
    if (isPublicRoute) {
      console.log(`✅ Allowing access to public route: ${path}`)
      return NextResponse.next()
    }

    // Handle auth pages
    if (isAuthPage) {
      console.log(`✅ Allowing access to auth page: ${path}`)

      // Special handling for setup page - allow access even if authenticated
      // The setup page itself will check if admin exists and redirect accordingly
      if (path === '/auth/setup') {
        console.log(`✅ Allowing access to setup page: ${path}`)
        return NextResponse.next()
      }

      // If we have a valid token, redirect authenticated users away from other auth pages
      if (token?.sub && token?.email) {
        console.log(`🔄 Redirecting authenticated user away from auth page: ${path}`)
        const redirectUrl = token.role === 'admin'
          ? new URL('/admin', req.url)
          : new URL('/user/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      // No token or invalid token, allow access to auth pages
      return NextResponse.next()
    }

    // For protected routes, verify authentication
    if (isProtectedRoute) {
      console.log(`🔒 Protected route accessed: ${path}`)
      // Check if we have a valid token
      if (!token?.sub || !token?.email) {
        console.log(`🔒 No valid token found, redirecting to login: ${path}`)
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Check admin access for admin routes
      if (isAdminRoute && token.role !== 'admin') {
        console.log(`🔒 Non-admin user accessing admin route: ${path}`)
        const redirectUrl = new URL('/user/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      // User has valid token, continue
      console.log(`✅ Allowing authenticated access to protected route: ${path}`)
      return NextResponse.next()
    }

    // Default: if not public, not auth, and not explicitly protected, require authentication
    if (!isPublicRoute && !isAuthPage) {
      console.log(`🔒 Default protection for: ${path}`)
      if (!token?.sub || !token?.email) {
        console.log(`🔒 Default protection: redirecting unauthenticated access to: ${path}`)
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    console.log(`✅ Allowing access to: ${path}`)
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login for safety
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('error', 'middleware-error')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
