import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-utils'
import { db } from '@/db'
import { users } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function DELETE(req: NextRequest) {
  try {
    const { result, response } = await authenticateRequest(true) // Admin only

    if (!result.isAuthenticated || result.error) {
      return response!
    }

    const { searchParams } = new URL(req.url)
    const userIdToDelete = searchParams.get('userId')

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Don't allow admin to delete themselves
    if (userIdToDelete === result.user!.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete the user
    const deletedUsers = await db.delete(users).where(
      eq(users.id, userIdToDelete)
    ).returning()

    if (deletedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${deletedUsers[0].email} has been deleted`,
      deletedUser: {
        id: deletedUsers[0].id,
        email: deletedUsers[0].email,
        name: deletedUsers[0].name
      }
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
