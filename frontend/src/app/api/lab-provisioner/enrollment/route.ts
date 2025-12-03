import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailNotificationService } from '@/services/email/EmailNotificationService'
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from '@/db/schemas/UserSchema'
import { labs } from "@/db/schemas/LabSchema";

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

    // Send enrollment notification email
    try {
      // Get user and lab details for email
      const [userDetails] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      const [labDetails] = await db
        .select({
          id: labs.id,
          name: labs.name,
          duration: labs.duration,
          description: labs.description,
        })
        .from(labs)
        .where(eq(labs.id, labId))
        .limit(1)

      if (userDetails && labDetails && userDetails.email) {
        await emailNotificationService.sendUserEnrollment(
          {
            id: userDetails.id,
            name: userDetails.name || "Student",
            email: userDetails.email,
            role: userDetails.role,
          },
          {
            labName: labDetails.name,
            labDescription:
              "An exciting hands-on lab experience to Master Linux and Cloud essential skills.",
            enrolledBy: "EzShell Enrollment Service",
            enrollmentDate: new Date(),
            accessUrl: `${process.env.NEXTAUTH_URL}/user/labs/${labDetails.id}`,
            duration: `${labDetails.duration} minutes`,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          }
        );

        console.log('Enrollment notification email sent successfully')
      }
    } catch (emailError) {
      console.error('Failed to send enrollment notification email:', emailError)
      // Don't fail the enrollment if email fails
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
