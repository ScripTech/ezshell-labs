import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Current session:', session)

    // Find the current user in database
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email)
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Current user from DB:', currentUser)

    // If user is admin@ezshell.local and not already admin, make them admin
    if (currentUser.email === 'admin@ezshell.local' && currentUser.role !== 'admin') {
      const [updatedUser] = await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, currentUser.id))
        .returning()

      console.log('Updated user to admin:', updatedUser)

      return NextResponse.json({
        message: 'User role updated to admin',
        user: updatedUser
      })
    }

    return NextResponse.json({
      message: 'User role is correct',
      user: currentUser
    })
  } catch (error) {
    console.error('Error checking/updating admin role:', error)
    return NextResponse.json(
      { error: 'Failed to check/update admin role' },
      { status: 500 }
    )
  }
}
