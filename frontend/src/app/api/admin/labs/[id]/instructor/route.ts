import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { labs } from '@/db/schemas/LabSchema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { instructorId } = body

    // Allow setting instructorId to null to unassign instructor
    const updateData = {
      instructorId: instructorId || null,
      updatedAt: new Date(),
    }

    const [updatedLab] = await db
      .update(labs)
      .set(updateData)
      .where(eq(labs.id, params.id))
      .returning()

    if (!updatedLab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedLab)
  } catch (error) {
    console.error('Error updating lab instructor:', error)
    return NextResponse.json(
      { error: 'Failed to update lab instructor' },
      { status: 500 }
    )
  }
}
