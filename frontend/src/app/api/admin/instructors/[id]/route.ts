import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { instructors } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [instructor] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.id, params.id))
      .limit(1)

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(instructor)
  } catch (error) {
    console.error('Error fetching instructor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, title, bio, avatar, email, experience, specializations, socialLinks, isActive } = body

    const updateData = {
      ...(name && { name }),
      ...(title && { title }),
      bio: bio || null,
      avatar: avatar || null,
      email: email || null,
      experience: experience || null,
      specializations: specializations || null,
      socialLinks: socialLinks || null,
      ...(typeof isActive === 'boolean' && { isActive }),
      updatedAt: new Date(),
    }

    const [updatedInstructor] = await db
      .update(instructors)
      .set(updateData)
      .where(eq(instructors.id, params.id))
      .returning()

    if (!updatedInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedInstructor)
  } catch (error) {
    console.error('Error updating instructor:', error)
    return NextResponse.json(
      { error: 'Failed to update instructor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedInstructor] = await db
      .delete(instructors)
      .where(eq(instructors.id, params.id))
      .returning()

    if (!deletedInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Instructor deleted successfully' })
  } catch (error) {
    console.error('Error deleting instructor:', error)
    return NextResponse.json(
      { error: 'Failed to delete instructor' },
      { status: 500 }
    )
  }
}
