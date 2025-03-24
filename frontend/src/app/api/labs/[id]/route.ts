import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { labs } from '@/db/schemas/LabSchema'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lab = await db.query.labs.findFirst({
      where: eq(labs.id, params.id),
      with: {
        exercises: {
          orderBy: (exercises, { asc }) => [asc(exercises.orderIndex)],
        },
        enrollments: {
          where: (enrollments, { eq }) => eq(enrollments.userId, userId),
        },
      },
    });

    if (!lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    return NextResponse.json(lab)
  } catch (error) {
    console.error('Error fetching lab details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lab details' },
      { status: 500 }
    )
  }
}
