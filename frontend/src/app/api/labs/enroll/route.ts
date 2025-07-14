import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { labs, labEnrollments, labTasks, labTaskProgress } from '@/db/schemas/LabSchema'
import { labSessionService } from '@/services/labSessionService'
import { nanoid } from 'nanoid'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { labId, startSession = false } = await request.json()

    // Check if user is already enrolled
    const existingEnrollment = await db.query.labEnrollments.findFirst({
      where: (enrollments, { and, eq }) =>
        and(eq(enrollments.userId, userId), eq(enrollments.labId, labId)),
    });

    if (existingEnrollment) {
      // If already enrolled and startSession is requested, try to start a session
      if (startSession) {
        try {
          const labSession = await labSessionService.startLabSession(userId, labId)
          return NextResponse.json({
            enrollment: existingEnrollment,
            session: labSession,
            message: 'Already enrolled, lab session started'
          })
        } catch (sessionError) {
          return NextResponse.json({
            enrollment: existingEnrollment,
            message: 'Already enrolled but failed to start session',
            sessionError: sessionError instanceof Error ? sessionError.message : 'Unknown error'
          })
        }
      }
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

    // Initialize lab_task_progress for all tasks in the lab
    const tasks = await db.select().from(labTasks).where(eq(labTasks.labId, labId));
    if (tasks.length > 0) {
      await db.insert(labTaskProgress).values(
        tasks.map(task => ({
          id: nanoid(),
          userId,
          labTaskId: task.id,
          labEnrollmentId: enrollment.id,
          score: 0,
          completed: false,
          createdAt: new Date(),
        }))
      );
    }

    // Start lab session if requested
    let labSession = null
    if (startSession) {
      try {
        labSession = await labSessionService.startLabSession(userId, labId)
      } catch (sessionError) {
        console.error('Failed to start lab session after enrollment:', sessionError)
        // Continue without session - user can start it manually later
      }
    }

    return NextResponse.json({
      enrollment: {
        ...enrollment,
        lab: {
          ...lab,
          isEnrolled: true,
        },
      },
      session: labSession,
      message: labSession ? 'Enrolled and lab session started successfully' : 'Enrolled successfully'
    })
  } catch (error) {
    console.error('Error enrolling in lab:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in lab' },
      { status: 500 }
    )
  }
}
