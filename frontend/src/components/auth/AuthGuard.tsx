'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requireAdmin = false, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      // Redirect to login with callback URL
      const callbackUrl = encodeURIComponent(window.location.href)
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }

    if (requireAdmin && session?.user?.role !== 'admin') {
      // Redirect non-admin users to dashboard
      router.push('/user/dashboard')
      return
    }
  }, [session, status, router, requireAdmin])

  // Show loading state
  if (status === 'loading') {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    )
  }

  // Show nothing while redirecting
  if (status === 'unauthenticated') {
    return null
  }

  // Check admin requirement
  if (requireAdmin && session?.user?.role !== 'admin') {
    return null
  }

  // Render children if authenticated (and admin if required)
  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAdmin?: boolean } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard requireAdmin={options.requireAdmin}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook for checking authentication status
export function useAuthGuard(requireAdmin = false) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = status === 'authenticated'
  const isAdmin = session?.user?.role === 'admin'
  const isLoading = status === 'loading'

  const redirectToLogin = () => {
    const callbackUrl = encodeURIComponent(window.location.href)
    router.push(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  const redirectToDashboard = () => {
    router.push('/user/dashboard')
  }

  return {
    isAuthenticated,
    isAdmin,
    isLoading,
    session,
    redirectToLogin,
    redirectToDashboard,
    canAccess: isAuthenticated && (!requireAdmin || isAdmin)
  }
}
