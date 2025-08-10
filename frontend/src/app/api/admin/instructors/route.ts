import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { instructors } from '@/db/schemas'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET() {
  try {
    const allInstructors = await db
      .select()
      .from(instructors)
      .orderBy(desc(instructors.createdAt))

    return NextResponse.json(allInstructors)
  } catch (error) {
    console.error('Error fetching instructors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, title, bio, avatar, email, experience, specializations, socialLinks } = body

    if (!name || !title) {
      return NextResponse.json(
        { error: 'Name and title are required' },
        { status: 400 }
      )
    }

    const newInstructor = {
      id: nanoid(),
      name,
      title,
      bio: bio || null,
      avatar: avatar || null,
      email: email || null,
      experience: experience || null,
      specializations: specializations || null,
      socialLinks: socialLinks || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [instructor] = await db
      .insert(instructors)
      .values(newInstructor)
      .returning()

    return NextResponse.json(instructor, { status: 201 })
  } catch (error) {
    console.error('Error creating instructor:', error)
    return NextResponse.json(
      { error: 'Failed to create instructor' },
      { status: 500 }
    )
  }
}
