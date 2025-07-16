import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear NextAuth session cookies
    const cookieStore = cookies()
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]

    // Instructions for clearing all user sessions
    const response = NextResponse.json({
      success: true,
      message: 'Session invalidation initiated',
      instructions: [
        'Database has been reset',
        'User JWT tokens may still be valid in browsers',
        'Users should clear browser cookies or use private/incognito mode',
        'Alternatively, restart NextAuth secret to invalidate all tokens'
      ]
    })

    // Clear admin's session cookies
    cookieNames.forEach(name => {
      response.cookies.delete(name)
    })

    return response

  } catch (error) {
    console.error('Error in session invalidation:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate sessions' },
      { status: 500 }
    )
  }
}
