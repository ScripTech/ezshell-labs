import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { authOptions } from '../../auth/[...nextauth]/route'
import { labs, labEnrollments } from '@/db/schemas/LabSchema'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { labId } = await request.json()

    // Check if user is already enrolled
    const existingEnrollment = await db.query.labEnrollments.findFirst({
      where: (enrollments, { and, eq }) =>
        and(eq(enrollments.userId, userId), eq(enrollments.labId, labId)),
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this lab' },
        { status: 400 }
      )
    }

    // Get lab details to verify it exists
    const lab = await db.query.labs.findFirst({
      where: eq(labs.id, labId),
    })

    if (!lab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      )
    }

    // Create new enrollment
    const [enrollment] = await db
      .insert(labEnrollments)
      .values({
        id: nanoid(),
        userId: userId,
        labId: labId,
        status: "enrolled",
        progress: 0,
        enrolledAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      ...enrollment,
      lab: {
        ...lab,
        isEnrolled: true,
      },
    })
  } catch (error) {
    console.error('Error enrolling in lab:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in lab' },
      { status: 500 }
    )
  }
}
