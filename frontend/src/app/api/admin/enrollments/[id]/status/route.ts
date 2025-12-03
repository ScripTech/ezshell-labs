import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labEnrollments } from '@/db/schemas/LabSchema'
import { eq } from 'drizzle-orm'

// GET /api/admin/enrollments/[id]/status - Get provisioning status for an enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollmentId = params.id

    // Get enrollment details
    const enrollment = await db
      .select()
      .from(labEnrollments)
      .where(eq(labEnrollments.id, enrollmentId))
      .limit(1)

    if (enrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const enrollmentData = enrollment[0]

    // If enrollment is in provisioning state, check with lab provisioner
    if (enrollmentData.status === 'provisioning') {
      try {
        const labProvisionerUrl = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002'

        const statusResponse = await fetch(`${labProvisionerUrl}/api/enrollment/status/${enrollmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()

          // Update local status if it has changed
          if (statusData.status && statusData.status !== enrollmentData.status) {
            await db
              .update(labEnrollments)
              .set({
                status: statusData.status
              })
              .where(eq(labEnrollments.id, enrollmentId))

            return NextResponse.json({
              ...enrollmentData,
              status: statusData.status,
              provisioning: statusData
            })
          }

          return NextResponse.json({
            ...enrollmentData,
            provisioning: statusData
          })
        }
      } catch (error) {
        console.error('Error fetching provisioning status:', error)
        // Return current enrollment status even if provisioner is unavailable
      }
    }

    return NextResponse.json(enrollmentData)

  } catch (error) {
    console.error('Error fetching enrollment status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
