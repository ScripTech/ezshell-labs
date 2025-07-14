import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { taskValidationService } from '@/services/taskValidationService'

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

    const history = await taskValidationService.getValidationHistory(
      session.user.id,
      params.taskId,
      labEnrollmentId
    )

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error getting validation history:', error)
    return NextResponse.json(
      { error: 'Failed to get validation history' },
      { status: 500 }
    )
  }
}
