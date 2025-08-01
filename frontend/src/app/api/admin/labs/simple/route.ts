import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labs } from '@/db/schemas/LabSchema'
import { like } from 'drizzle-orm'

// GET /api/admin/labs/simple - Get labs for dropdowns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause = search ? like(labs.name, `%${search}%`) : undefined

    const labList = await db
      .select({
        id: labs.id,
        name: labs.name,
        labId: labs.labId,
        description: labs.description,
        duration: labs.duration,
      })
      .from(labs)
      .where(whereClause)
      .orderBy(labs.name)
      .limit(limit)

    return NextResponse.json({ labs: labList })

  } catch (error) {
    console.error('Error fetching labs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
