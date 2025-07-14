import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { labSessions } from '@/db/schemas/LabSchema'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const history = await db.query.labSessions.findMany({
      where: eq(labSessions.userId, session.user.id),
      with: {
        lab: true,
      },
      orderBy: (sessions, { desc }) => [desc(sessions.startTime)],
    })

    const formattedHistory = history.map(session => ({
      id: session.id,
      labName: session.lab?.name,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.isActive ? 'in_progress' : 'completed',
      progress: 0, // Calculate this based on exercises completed
      duration: session.lab?.duration,
    }))

    return NextResponse.json(formattedHistory)
  } catch (error) {
    console.error('Error fetching lab history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lab history' },
      { status: 500 }
    )
  }
}
