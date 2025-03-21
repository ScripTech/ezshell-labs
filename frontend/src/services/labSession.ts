import { eq, and, gt } from 'drizzle-orm'
import { db } from '@/db'
import { labSessions } from '@/db/schema'
import { LabSessionSchema } from '@/db/schemas/LabSessionSchema'
import { nanoid } from 'nanoid'

export class LabSessionService {
  static async createLabSession(userId: string) {
    const activeSession = await db.query.labSessions.findFirst({
      where: and(
        eq(labSessions.userId, userId),
        eq(labSessions.isActive, true)
      ),
    })

    if (activeSession) {
      throw new Error('User already has an active lab session')
    }

    const sessionData = {
      id: nanoid(),
      userId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60 * 1000),
      isActive: true,
    }

    const validatedData = LabSessionSchema.parse(sessionData)

    const [session] = await db.insert(labSessions)
      .values(validatedData)
      .returning()

    return session
  }

  static async checkActiveSession(userId: string) {
    return await db.query.labSessions.findFirst({
      where: and(
        eq(labSessions.userId, userId),
        eq(labSessions.isActive, true),
        gt(labSessions.endTime, new Date())
      ),
    })
  }
}
