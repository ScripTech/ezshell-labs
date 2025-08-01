import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labEnrollments, labs, labSessions } from '@/db/schemas/LabSchema'
import { users } from '@/db/schemas/UserSchema'
import { eq, and, count } from 'drizzle-orm'

// GET /api/admin/enrollments/[id] - Get specific enrollment with session count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollmentId = params.id

    // Get enrollment details with user and lab info
    const enrollment = await db
      .select({
        enrollment: labEnrollments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        lab: {
          id: labs.id,
          name: labs.name,
          labId: labs.labId,
          description: labs.description,
          duration: labs.duration,
        }
      })
      .from(labEnrollments)
      .leftJoin(users, eq(labEnrollments.userId, users.id))
      .leftJoin(labs, eq(labEnrollments.labId, labs.id))
      .where(eq(labEnrollments.id, enrollmentId))
      .limit(1)

    if (enrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Get session count for this enrollment
    const sessionCount = await db
      .select({ count: count() })
      .from(labSessions)
      .where(and(
        eq(labSessions.userId, enrollment[0].enrollment.userId!),
        eq(labSessions.labId, enrollment[0].enrollment.labId!)
      ))

    return NextResponse.json({
      ...enrollment[0],
      sessionCount: sessionCount[0].count
    })

  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/enrollments/[id] - Unenroll user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollmentId = params.id

    // Check if enrollment exists
    const existingEnrollment = await db
      .select()
      .from(labEnrollments)
      .where(eq(labEnrollments.id, enrollmentId))
      .limit(1)

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Delete enrollment (this will cascade to related records)
    await db
      .delete(labEnrollments)
      .where(eq(labEnrollments.id, enrollmentId))

    return NextResponse.json({
      message: 'User unenrolled successfully'
    })

  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/enrollments/[id] - Update enrollment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollmentId = params.id
    const { status, progress } = await request.json()

    // Check if enrollment exists
    const existingEnrollment = await db
      .select()
      .from(labEnrollments)
      .where(eq(labEnrollments.id, enrollmentId))
      .limit(1)

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Update enrollment
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (progress !== undefined) updateData.progress = progress
    if (status === 'completed') updateData.completedAt = new Date().toISOString()

    const updatedEnrollment = await db
      .update(labEnrollments)
      .set(updateData)
      .where(eq(labEnrollments.id, enrollmentId))
      .returning()

    return NextResponse.json({
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment[0]
    })

  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
