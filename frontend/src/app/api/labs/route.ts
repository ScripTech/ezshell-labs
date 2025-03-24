import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { labSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userLabs = await db.query.labSessions.findMany({
      where: eq(labSessions.userId, session.user.id),
      orderBy: (labs, { desc }) => [desc(labs.startTime)],
    })
    return NextResponse.json(userLabs)
  } catch (error) {
    console.error('Error fetching lab sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lab sessions' },
      { status: 500 }
    )
  }
}
