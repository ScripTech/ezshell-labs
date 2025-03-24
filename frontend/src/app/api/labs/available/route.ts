import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const availableLabs = await db.query.labs.findMany({
      orderBy: (labs, { asc }) => [asc(labs.name)],
    })
    return NextResponse.json(availableLabs)
  } catch (error) {
    console.error('Error fetching available labs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available labs' },
      { status: 500 }
    )
  }
}
