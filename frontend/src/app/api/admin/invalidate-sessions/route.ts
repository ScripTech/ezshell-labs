import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const { result, response } = await authenticateRequest(true)

    if (!result.isAuthenticated || result.error) {
      return response!
    }

    // Clear NextAuth session cookies
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]

    // Instructions for clearing all user sessions
    const responseData = NextResponse.json({
      success: true,
      message: 'Session invalidation initiated',
      admin: result.user?.name || 'Admin',
      timestamp: new Date().toISOString(),
      instructions: [
        'Database has been reset',
        'User JWT tokens may still be valid in browsers',
        'Users should clear browser cookies or use private/incognito mode',
        'Alternatively, restart NextAuth secret to invalidate all tokens',
        'Updated auth middleware will now validate users against database'
      ]
    })

    // Clear admin's session cookies
    cookieNames.forEach(name => {
      responseData.cookies.delete(name)
    })

    return responseData

  } catch (error) {
    console.error('Error in session invalidation:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate sessions' },
      { status: 500 }
    )
  }
}
