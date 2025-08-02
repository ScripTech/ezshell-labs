import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { labEnrollments, labs, labSessions, labTaskProgress } from '@/db/schemas/LabSchema'
import { users } from '@/db/schemas/UserSchema'
import { eq, and, count, sql, desc, gte, between } from 'drizzle-orm'

// GET /api/admin/analytics - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30' // days
    const labId = searchParams.get('labId')

    const timeframeDate = new Date()
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe))

    // Build where conditions for time filtering
    const timeFilter = gte(labEnrollments.enrolledAt, timeframeDate)
    const labFilter = labId ? eq(labEnrollments.labId, labId) : undefined
    const whereConditions = labFilter ? and(timeFilter, labFilter) : timeFilter

    // 1. Overview Statistics
    const totalUsers = await db
      .select({ count: count() })
      .from(users)

    const totalLabs = await db
      .select({ count: count() })
      .from(labs)

    const totalEnrollments = await db
      .select({ count: count() })
      .from(labEnrollments)
      .where(whereConditions)

    const completedEnrollments = await db
      .select({ count: count() })
      .from(labEnrollments)
      .where(and(
        whereConditions,
        eq(labEnrollments.status, 'completed')
      ))

    const activeSessions = await db
      .select({ count: count() })
      .from(labSessions)
      .where(and(
        eq(labSessions.isActive, true),
        gte(labSessions.startTime, timeframeDate)
      ))

    // 2. Most Popular Labs
    const popularLabs = await db
      .select({
        lab: {
          id: labs.id,
          name: labs.name,
          labId: labs.labId,
        },
        enrollmentCount: count(labEnrollments.id),
      })
      .from(labs)
      .leftJoin(labEnrollments, eq(labs.id, labEnrollments.labId))
      .where(labFilter || undefined)
      .groupBy(labs.id, labs.name, labs.labId)
      .orderBy(desc(count(labEnrollments.id)))
      .limit(10)

    // 3. User Engagement by Role
    const userEngagement = await db
      .select({
        role: users.role,
        userCount: count(users.id),
        enrollmentCount: sql<number>`count(distinct ${labEnrollments.id})`,
        avgProgress: sql<number>`avg(${labEnrollments.progress})`,
      })
      .from(users)
      .leftJoin(labEnrollments, and(
        eq(users.id, labEnrollments.userId),
        whereConditions
      ))
      .groupBy(users.role)

    // 4. Daily Enrollment Trends (last 30 days)
    const enrollmentTrends = await db
      .select({
        date: sql<string>`date(${labEnrollments.enrolledAt})`,
        enrollments: count(labEnrollments.id),
      })
      .from(labEnrollments)
      .where(and(
        gte(labEnrollments.enrolledAt, timeframeDate),
        labFilter || undefined
      ))
      .groupBy(sql`date(${labEnrollments.enrolledAt})`)
      .orderBy(sql`date(${labEnrollments.enrolledAt})`)

    // 5. Completion Rates by Lab
    const completionRates = await db
      .select({
        lab: {
          id: labs.id,
          name: labs.name,
          labId: labs.labId,
        },
        totalEnrollments: count(labEnrollments.id),
        completedEnrollments: sql<number>`count(case when ${labEnrollments.status} = 'completed' then 1 end)`,
        completionRate: sql<number>`round(count(case when ${labEnrollments.status} = 'completed' then 1 end) * 100.0 / count(${labEnrollments.id}), 2)`,
        avgProgress: sql<number>`round(avg(${labEnrollments.progress}), 2)`,
      })
      .from(labs)
      .leftJoin(labEnrollments, and(
        eq(labs.id, labEnrollments.labId),
        whereConditions
      ))
      .groupBy(labs.id, labs.name, labs.labId)
      .having(sql`count(${labEnrollments.id}) > 0`)
      .orderBy(desc(sql`count(case when ${labEnrollments.status} = 'completed' then 1 end)`))

    // 6. Session Duration Analytics
    const sessionAnalytics = await db
      .select({
        avgSessionDuration: sql<number>`avg(extract(epoch from (coalesce(${labSessions.endTime}, now()) - ${labSessions.startTime})) / 60)`,
        totalSessions: count(labSessions.id),
        activeSessions: sql<number>`count(case when ${labSessions.isActive} = true then 1 end)`,
      })
      .from(labSessions)
      .where(gte(labSessions.startTime, timeframeDate))

    // 7. Top Performing Users
    const topUsers = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        enrollmentCount: count(labEnrollments.id),
        completedCount: sql<number>`count(case when ${labEnrollments.status} = 'completed' then 1 end)`,
        avgProgress: sql<number>`round(avg(${labEnrollments.progress}), 2)`,
        totalSessions: sql<number>`count(distinct ${labSessions.id})`,
      })
      .from(users)
      .leftJoin(labEnrollments, and(
        eq(users.id, labEnrollments.userId),
        whereConditions
      ))
      .leftJoin(labSessions, and(
        eq(users.id, labSessions.userId),
        gte(labSessions.startTime, timeframeDate)
      ))
      .groupBy(users.id, users.name, users.email, users.role)
      .having(sql`count(${labEnrollments.id}) > 0`)
      .orderBy(desc(sql`count(case when ${labEnrollments.status} = 'completed' then 1 end)`))
      .limit(10)

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers[0].count,
        totalLabs: totalLabs[0].count,
        totalEnrollments: totalEnrollments[0].count,
        completedEnrollments: completedEnrollments[0].count,
        activeSessions: activeSessions[0].count,
        completionRate: totalEnrollments[0].count > 0
          ? Math.round((completedEnrollments[0].count / totalEnrollments[0].count) * 100 * 100) / 100
          : 0
      },
      popularLabs,
      userEngagement,
      enrollmentTrends,
      completionRates,
      sessionAnalytics: sessionAnalytics[0],
      topUsers,
      timeframe: parseInt(timeframe),
      labId
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
