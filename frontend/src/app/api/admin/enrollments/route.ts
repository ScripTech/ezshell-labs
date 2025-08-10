import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labEnrollments, labs, labSessions } from '@/db/schemas/LabSchema'
import { users } from '@/db/schemas/UserSchema'
import { eq, and, count, desc } from 'drizzle-orm'

// GET /api/admin/enrollments - Get all enrollments with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const labId = searchParams.get('labId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    // Build where conditions
    let whereConditions = []
    if (labId) whereConditions.push(eq(labEnrollments.labId, labId))
    if (userId) whereConditions.push(eq(labEnrollments.userId, userId))
    if (status) whereConditions.push(eq(labEnrollments.status, status))

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get enrollments with user and lab details
    const enrollments = await db
      .select({
        enrollment: labEnrollments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        lab: {
          id: labs.id,
          name: labs.name,
          labId: labs.labId,
          description: labs.description,
          duration: labs.duration,
        }
      })
      .from(labEnrollments)
      .leftJoin(users, eq(labEnrollments.userId, users.id))
      .leftJoin(labs, eq(labEnrollments.labId, labs.id))
      .where(whereClause)
      .orderBy(desc(labEnrollments.enrolledAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(labEnrollments)
      .where(whereClause)

    const total = totalResult[0].count

    return NextResponse.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/enrollments - Create new enrollment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, labId } = await request.json()

    if (!userId || !labId) {
      return NextResponse.json({ error: 'userId and labId are required' }, { status: 400 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await db
      .select()
      .from(labEnrollments)
      .where(and(
        eq(labEnrollments.userId, userId),
        eq(labEnrollments.labId, labId)
      ))
      .limit(1)

    if (existingEnrollment.length > 0) {
      return NextResponse.json({ error: 'User is already enrolled in this lab' }, { status: 409 })
    }

    // Verify user and lab exist
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const labExists = await db
      .select({ id: labs.id })
      .from(labs)
      .where(eq(labs.id, labId))
      .limit(1)

    if (userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (labExists.length === 0) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    // Let the lab provisioner handle enrollment creation and AWS provisioning
    try {
      const labProvisionerUrl = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002'

      console.log(`Attempting to enroll user ${userId} in lab ${labId} via lab provisioner at ${labProvisionerUrl}`)

      const provisioningResponse = await fetch(`${labProvisionerUrl}/api/enrollment/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          labId
        }),
      })

      if (!provisioningResponse.ok) {
        const errorData = await provisioningResponse.json()
        console.error('Lab provisioner enrollment failed:', errorData)

        return NextResponse.json({
          error: errorData.error || 'Failed to enroll user',
          details: errorData.message || 'Lab provisioner service error'
        }, { status: provisioningResponse.status })
      }

      const enrollmentData = await provisioningResponse.json()
      console.log('Lab provisioner enrollment successful:', enrollmentData)

      return NextResponse.json({
        message: 'User enrolled successfully and AWS provisioning initiated',
        enrollment: enrollmentData
      }, { status: 201 })

    } catch (provisioningError) {
      console.error('Error connecting to lab provisioner service:', provisioningError)

      return NextResponse.json({
        error: 'Lab provisioner service unavailable',
        details: provisioningError instanceof Error ? provisioningError.message : 'Service unavailable'
      }, { status: 503 })
    }  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
