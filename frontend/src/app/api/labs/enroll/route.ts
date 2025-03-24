import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { labSessions } from '@/db/schemas'
import { authOptions } from '../../auth/[...nextauth]/route'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { labId } = await req.json()

    const [labSession] = await db.insert(labSessions)
      .values({
        id: nanoid(),
        userId: session.user.id,
        labId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
      })
      .returning()

    return NextResponse.json(labSession)
  } catch (error) {
    console.error('Error enrolling in lab:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in lab' },
      { status: 500 }
    )
  }
}
