'use client'

import { useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'

/**
 * Global handler for 401 responses - automatically signs out users
 */
export function useAuthErrorHandler() {
  const { data: session, status } = useSession()
  const isHandlingRef = useRef(false)

  useEffect(() => {
    if (status === 'loading' || isHandlingRef.current) return

    // If we have client-side session but it's empty (session returned as {}), sign out
    if (status === 'unauthenticated' && document.cookie.includes('next-auth.session-token')) {
      console.log('🔒 Session mismatch detected - cookie exists but session is null')
      isHandlingRef.current = true
      signOut({
        callbackUrl: '/auth/login?error=session-invalid',
        redirect: true
      }).finally(() => {
        isHandlingRef.current = false
      })
      return
    }

    // Intercept fetch requests globally
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        // If we get a 401 and the user thinks they're authenticated, sign them out
        if (response.status === 401 && session && !isHandlingRef.current) {
          console.log('🔒 Received 401 response - Auto-signing out user', {
            url: args[0],
            sessionExists: !!session
          })

          isHandlingRef.current = true
          await signOut({
            callbackUrl: '/auth/login?error=session-expired',
            redirect: true
          })
        }

        return response
      } catch (error) {
        console.error('Fetch error:', error)
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [session, status])

  // Additional session validity check
  useEffect(() => {
    if (session && status === 'authenticated' && !isHandlingRef.current) {
      const testSessionValidity = async () => {
        try {
          const response = await fetch('/api/auth/session')
          const sessionData = await response.json()

          // If session endpoint returns empty object but we think we have a session
          if (response.ok && (!sessionData || Object.keys(sessionData).length === 0)) {
            console.log('🔒 Session validity check failed - Auto-signing out user')
            isHandlingRef.current = true
            await signOut({
              callbackUrl: '/auth/login?error=session-invalid',
              redirect: true
            })
          }
        } catch (error) {
          console.error('Session validity check failed:', error)
        }
      }

      // Check immediately and then periodically
      testSessionValidity()
      const interval = setInterval(testSessionValidity, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
  }, [session, status])
}

/**
 * Component that sets up global auth error handling
 */
export function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  useAuthErrorHandler()
  return <>{children}</>
}
