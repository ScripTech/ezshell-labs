import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { authOptions } from '../../auth/[...nextauth]/route'
import { labEnrollments } from '@/db/schemas/LabSchema'
import { Lab } from '@/types/labs'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const availableLabs = await db.query.labs.findMany({
      with: {
        enrollments: {
          where: (enrollments, { eq }) => eq(enrollments.userId, userId),
        },
      },
      orderBy: (labs, { asc }) => [asc(labs.name)],
    });

    // Get total enrollment counts
    const enrollmentCounts = await db
      .select({
        labId: labEnrollments.labId,
        count: sql<number>`count(*)::int`,
      })
      .from(labEnrollments)
      .groupBy(labEnrollments.labId)

    const transformedLabs = availableLabs.map(lab => {
      const isEnrolled = lab.enrollments.length > 0

      return {
        id: lab.id,
        name: lab.name,
        description: lab.description ?? undefined,
        duration: lab.duration,
        imageUrl: lab.imageUrl ?? undefined,
        createdAt: lab.createdAt!,
        updatedAt: lab.updatedAt!,
        isEnrolled,
        enrolledCount: enrollmentCounts.length,
        exercises: [],
        progress: {
          completed: 0,
          total: 0,
          exercises: [],
        },
      } satisfies Lab
    })

    return NextResponse.json(transformedLabs)
  } catch (error) {
    console.error('Error fetching available labs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available labs' },
      { status: 500 }
    )
  }
}
