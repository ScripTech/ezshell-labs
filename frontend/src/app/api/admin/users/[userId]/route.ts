import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, organizations } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user with organization details
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        organization: {
          id: organizations.id,
          name: organizations.name,
          website: organizations.website,
          plan: organizations.plan,
        }
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, userId))
      .limit(1)

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult[0]

    // Format the response
    const response = {
      ...user,
      organization: user.organization?.id ? user.organization : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { userId } = params
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const { name, email, role, organizationId } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (role && !['admin', 'manager', 'user', 'clientUser'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (emailCheck.length > 0 && emailCheck[0].id !== userId) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (organizationId !== undefined) updateData.organizationId = organizationId

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    // Fetch updated user
    const updatedUserResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        organization: {
          id: organizations.id,
          name: organizations.name,
          website: organizations.website,
          plan: organizations.plan,
        }
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, userId))
      .limit(1)

    const updatedUser = updatedUserResult[0]

    const response = {
      ...updatedUser,
      organization: updatedUser.organization?.id ? updatedUser.organization : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
