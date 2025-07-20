import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { labId } = await request.json()

    if (!labId) {
      return NextResponse.json({ error: 'Lab ID is required' }, { status: 400 })
    }

    const labProvisionerUrl = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002'

    const response = await fetch(`${labProvisionerUrl}/api/enrollment/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        labId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Lab provisioner error:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to enroll in lab' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error enrolling in lab:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
