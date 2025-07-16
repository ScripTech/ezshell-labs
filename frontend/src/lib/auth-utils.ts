import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

/**
 * Server-side authentication check for API routes
 * @param requireAdmin - Whether admin role is required
 * @returns Authentication result with user data or error response
 */
export async function authenticateRequest(requireAdmin = false): Promise<{
  result: AuthResult
  response?: NextResponse
}> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        result: {
          user: null,
          error: 'Unauthorized - No valid session found',
          isAuthenticated: false,
          isAdmin: false
        },
        response: NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        )
      }
    }

    // Verify user exists in database
    const userId = session.user?.id
    if (!userId) {
      return {
        result: {
          user: null,
          error: 'Unauthorized - No valid user ID in session',
          isAuthenticated: false,
          isAdmin: false
        },
        response: NextResponse.json(
          { error: 'Unauthorized - No valid user ID in session' },
          { status: 401 }
        )
      }
    }
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!user) {
      return {
        result: {
          user: null,
          error: 'User not found in database',
          isAuthenticated: false,
          isAdmin: false
        },
        response: NextResponse.json(
          { error: 'User account not found - Please sign in again' },
          { status: 401 }
        )
      }
    }

    const isAdmin = user.role === 'admin'

    if (requireAdmin && !isAdmin) {
      return {
        result: {
          user: {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            role: user.role || 'user'
          },
          error: 'Admin access required',
          isAuthenticated: true,
          isAdmin: false
        },
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return {
      result: {
        user: {
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          role: user.role || 'user'
        },
        error: null,
        isAuthenticated: true,
        isAdmin
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      result: {
        user: null,
        error: 'Authentication verification failed',
        isAuthenticated: false,
        isAdmin: false
      },
      response: NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware helper for API routes that require authentication
 * @param handler - The API route handler
 * @param requireAdmin - Whether admin role is required
 */
export function withAuth(
  handler: (req: Request, context: { user: AuthenticatedUser }) => Promise<Response>,
  requireAdmin = false
) {
  return async function authenticatedHandler(req: Request, context: any) {
    const { result, response } = await authenticateRequest(requireAdmin)

    if (!result.isAuthenticated || result.error) {
      return response!
    }

    return handler(req, { ...context, user: result.user! })
  }
}

/**
 * Quick authentication check that returns user or throws
 * @param requireAdmin - Whether admin role is required
 */
export async function requireAuth(requireAdmin = false): Promise<AuthenticatedUser> {
  const { result, response } = await authenticateRequest(requireAdmin)

  if (!result.isAuthenticated || result.error) {
    throw new Error(result.error || 'Authentication required')
  }

  return result.user!
}
