import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const { enrollmentId } = params

    const labProvisionerUrl = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002'

    const response = await fetch(`${labProvisionerUrl}/api/enrollment/status/${enrollmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Lab provisioner error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch provisioning status' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching provisioning status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
