import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labEnrollments } from '@/db/schemas/LabSchema'
import { eq } from 'drizzle-orm'

// POST /api/admin/enrollments/[id]/provision - Manually trigger AWS provisioning for an enrollment
export async function POST(
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

    // Update status to provisioning
    await db
      .update(labEnrollments)
      .set({
        status: 'provisioning'
      })
      .where(eq(labEnrollments.id, enrollmentId))

    // Trigger AWS provisioning
    try {
      const labProvisionerUrl = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002'

      const provisioningResponse = await fetch(`${labProvisionerUrl}/api/enrollment/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: enrollmentData.userId,
          labId: enrollmentData.labId,
          enrollmentId
        }),
      })

      if (!provisioningResponse.ok) {
        const errorData = await provisioningResponse.json()
        console.error('AWS provisioning failed:', errorData)

        // Update status to failed
        await db
          .update(labEnrollments)
          .set({
            status: 'provisioning_failed'
          })
          .where(eq(labEnrollments.id, enrollmentId))

        return NextResponse.json({
          error: errorData.error || 'AWS provisioning failed'
        }, { status: 500 })
      }

      const provisioningData = await provisioningResponse.json()

      return NextResponse.json({
        message: 'AWS provisioning initiated successfully',
        enrollment: {
          ...enrollmentData,
          status: 'provisioning'
        },
        provisioning: provisioningData
      })

    } catch (provisioningError) {
      console.error('Error triggering AWS provisioning:', provisioningError)

      // Update status to failed
      await db
        .update(labEnrollments)
        .set({
          status: 'provisioning_failed'
        })
        .where(eq(labEnrollments.id, enrollmentId))

      return NextResponse.json({
        error: 'Failed to connect to lab provisioner service'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in provisioning endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
