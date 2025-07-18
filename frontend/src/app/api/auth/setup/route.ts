import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schemas/UserSchema'
import { PasswordService } from '@/lib/password'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if any admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'admin')
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists. Use the admin panel to create additional users.' },
        { status: 409 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Validate password strength
    const passwordValidation = PasswordService.validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password validation failed', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await PasswordService.hashPassword(password)

    // Create the first admin user
    const newAdmin = await db.insert(users).values({
      id: nanoid(),
      email,
      password: hashedPassword,
      name: name || email,
      role: 'admin',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })

    return NextResponse.json({
      message: 'First admin user created successfully',
      user: newAdmin[0]
    })

  } catch (error) {
    console.error('Error creating first admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check if any admin user exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'admin'),
      columns: { id: true }
    })

    return NextResponse.json({
      hasAdmin: !!existingAdmin,
      needsSetup: !existingAdmin
    })

  } catch (error) {
    console.error('Error checking admin setup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
