import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { taskValidationService, ValidationStep } from '@/services/taskValidationService'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const labEnrollmentId = searchParams.get('enrollmentId')

    if (!labEnrollmentId) {
      return NextResponse.json({ error: 'Lab enrollment ID is required' }, { status: 400 })
    }

    const progress = await taskValidationService.getTaskProgress(
      session.user.id,
      params.taskId,
      labEnrollmentId
    )

    if (!progress) {
      // Initialize progress if it doesn't exist
      const newProgress = await taskValidationService.initializeTaskProgress(
        session.user.id,
        params.taskId,
        labEnrollmentId
      )
      return NextResponse.json(newProgress)
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error getting task progress:', error)
    return NextResponse.json(
      { error: 'Failed to get task progress' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { labEnrollmentId, validationSteps } = body

    if (!labEnrollmentId) {
      return NextResponse.json({ error: 'Lab enrollment ID is required' }, { status: 400 })
    }

    if (!validationSteps || !Array.isArray(validationSteps)) {
      return NextResponse.json({ error: 'Validation steps are required' }, { status: 400 })
    }

    // Validate the structure of validation steps
    const isValidSteps = validationSteps.every((step: any) =>
      typeof step.id === 'string' &&
      typeof step.description === 'string' &&
      typeof step.passed === 'boolean' &&
      typeof step.points === 'number'
    )

    if (!isValidSteps) {
      return NextResponse.json({ error: 'Invalid validation steps format' }, { status: 400 })
    }

    const result = await taskValidationService.recordValidationAttempt(
      session.user.id,
      params.taskId,
      labEnrollmentId,
      validationSteps as ValidationStep[]
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error recording validation attempt:', error)

    if (error instanceof Error) {
      if (error.message.includes('Maximum attempts') || error.message.includes('already completed')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to record validation attempt' },
      { status: 500 }
    )
  }
}
