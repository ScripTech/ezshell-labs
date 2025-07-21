import { db } from "@/db"
import { labProgressSessions } from "@/db/schemas/ProgressSchema"
import { labs, labEnrollments } from "@/db/schemas/LabSchema"
import { eq, and, desc } from "drizzle-orm"
import { nanoid } from "nanoid"

export interface LabSession {
  id: string
  userId: string | null
  labId: string | null
  enrollmentId: string | null
  sessionName?: string | null
  startedAt: Date | null
  lastActiveAt: Date | null
  endedAt?: Date | null
  pausedAt?: Date | null
  resumedAt?: Date | null
  expiresAt: Date | null
  status: string | null
  totalTimeSpent: number | null
  timeRemaining?: number | null
  currentTaskId?: string | null
  overallProgress: string | null // decimal type returns as string
  autoSaveInterval: number | null
  metadata: unknown
  createdAt: Date | null
  updatedAt: Date | null
}

export interface SessionTimeInfo {
  timeRemaining: number // in seconds
  totalDuration: number // in seconds
  timeSpent: number // in seconds
  percentage: number // progress percentage
  isExpired: boolean
  canPause: boolean
  canResume: boolean
}

export class LabSessionService {

  private formatSessionResponse(session: any): LabSession {
    return {
      ...session,
      overallProgress: parseFloat(session.overallProgress || "0"),
      totalTimeSpent: session.totalTimeSpent || 0,
      timeRemaining: session.timeRemaining || 0,
      autoSaveInterval: session.autoSaveInterval || 30
    } as LabSession
  }

  /**
   * Start a new lab session for an enrolled user
   */
  async startLabSession(userId: string, labId: string): Promise<LabSession> {
    try {
      // Get enrollment info
      const enrollment = await db
        .select()
        .from(labEnrollments)
        .where(and(
          eq(labEnrollments.userId, userId),
          eq(labEnrollments.labId, labId)
        ))
        .limit(1)

      if (!enrollment.length) {
        throw new Error(`User is not enrolled in this lab: ${labId}`);
      }

      // Get lab info for duration
      const labInfo = await db
        .select()
        .from(labs)
        .where(eq(labs.id, labId))
        .limit(1)

      if (!labInfo.length) {
        throw new Error("Lab not found")
      }

      // Check if there's already an active session
      const existingSession = await this.getActiveSession(userId, labId)
      if (existingSession) {
        // Resume existing session if it's paused
        if (existingSession.status === 'paused') {
          return await this.resumeSession(existingSession.id)
        }
        return existingSession
      }

      // Calculate expiration time based on lab duration
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (labInfo[0].duration * 60 * 1000))

      const sessionId = nanoid()
      const sessionName = `${labInfo[0].name}-Session-${Date.now()}`

      // Create new session
      const [newSession] = await db
        .insert(labProgressSessions)
        .values({
          id: sessionId,
          userId,
          labId,
          enrollmentId: enrollment[0].id,
          sessionName,
          startedAt: now,
          lastActiveAt: now,
          expiresAt,
          status: 'active',
          totalTimeSpent: 0,
          timeRemaining: labInfo[0].duration * 60, // convert minutes to seconds
          overallProgress: "0", // decimal as string
          autoSaveInterval: 30,
          metadata: {
            labDuration: labInfo[0].duration,
            startTimestamp: now.toISOString()
          },
          createdAt: now,
          updatedAt: now
        })
        .returning()

      return this.formatSessionResponse(newSession)
    } catch (error) {
      console.error("Error starting lab session:", error)
      throw error
    }
  }

  /**
   * Get active session for a user and lab
   */
  async getActiveSession(userId: string, labId: string): Promise<LabSession | null> {
    try {
      const sessions = await db
        .select()
        .from(labProgressSessions)
        .where(and(
          eq(labProgressSessions.userId, userId),
          eq(labProgressSessions.labId, labId),
          eq(labProgressSessions.status, 'active')
        ))
        .orderBy(desc(labProgressSessions.lastActiveAt))
        .limit(1)

      return sessions.length > 0 ? this.formatSessionResponse(sessions[0]) : null
    } catch (error) {
      console.error("Error getting active session:", error)
      throw error
    }
  }

  /**
   * Pause a lab session
   */
  async pauseSession(sessionId: string): Promise<LabSession> {
    try {
      const now = new Date()

      // Get current session to calculate time spent
      const currentSession = await db
        .select()
        .from(labProgressSessions)
        .where(eq(labProgressSessions.id, sessionId))
        .limit(1)

      if (!currentSession.length) {
        throw new Error("Session not found")
      }

      const session = currentSession[0]

      // Calculate additional time spent since last active
      const additionalTime = Math.floor((now.getTime() - new Date(session.lastActiveAt!).getTime()) / 1000)
      const newTotalTimeSpent = (session.totalTimeSpent || 0) + additionalTime

      // Update session
      const [updatedSession] = await db
        .update(labProgressSessions)
        .set({
          status: 'paused',
          pausedAt: now,
          lastActiveAt: now,
          totalTimeSpent: newTotalTimeSpent,
          updatedAt: now
        })
        .where(eq(labProgressSessions.id, sessionId))
        .returning()

      return this.formatSessionResponse(updatedSession)
    } catch (error) {
      console.error("Error pausing session:", error)
      throw error
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<LabSession> {
    try {
      const now = new Date()

      const [updatedSession] = await db
        .update(labProgressSessions)
        .set({
          status: 'active',
          resumedAt: now,
          lastActiveAt: now,
          updatedAt: now
        })
        .where(eq(labProgressSessions.id, sessionId))
        .returning()

      return this.formatSessionResponse(updatedSession)
    } catch (error) {
      console.error("Error resuming session:", error)
      throw error
    }
  }

  /**
   * End a lab session
   */
  async endSession(sessionId: string, status: 'completed' | 'abandoned' = 'completed'): Promise<LabSession> {
    try {
      const now = new Date()

      // Get current session to calculate final time spent
      const currentSession = await db
        .select()
        .from(labProgressSessions)
        .where(eq(labProgressSessions.id, sessionId))
        .limit(1)

      if (!currentSession.length) {
        throw new Error("Session not found")
      }

      const session = currentSession[0]

      // Calculate final time spent
      const additionalTime = session.status === 'active'
        ? Math.floor((now.getTime() - new Date(session.lastActiveAt!).getTime()) / 1000)
        : 0
      const finalTimeSpent = (session.totalTimeSpent || 0) + additionalTime

      const [updatedSession] = await db
        .update(labProgressSessions)
        .set({
          status,
          endedAt: now,
          lastActiveAt: now,
          totalTimeSpent: finalTimeSpent,
          timeRemaining: 0,
          updatedAt: now
        })
        .where(eq(labProgressSessions.id, sessionId))
        .returning()

      return this.formatSessionResponse(updatedSession)
    } catch (error) {
      console.error("Error ending session:", error)
      throw error
    }
  }

  /**
   * Update session activity (heartbeat)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const now = new Date()

      await db
        .update(labProgressSessions)
        .set({
          lastActiveAt: now,
          updatedAt: now
        })
        .where(eq(labProgressSessions.id, sessionId))
    } catch (error) {
      console.error("Error updating session activity:", error)
      throw error
    }
  }

  /**
   * Get session time information
   */
  async getSessionTimeInfo(sessionId: string): Promise<SessionTimeInfo> {
    try {
      const sessions = await db
        .select()
        .from(labProgressSessions)
        .where(eq(labProgressSessions.id, sessionId))
        .limit(1)

      if (!sessions.length) {
        throw new Error("Session not found")
      }

      const session = sessions[0]
      const now = new Date()
      const expiresAt = new Date(session.expiresAt!)
      const startedAt = new Date(session.startedAt!)

      // Calculate time spent
      let timeSpent = session.totalTimeSpent || 0
      if (session.status === 'active') {
        const additionalTime = Math.floor((now.getTime() - new Date(session.lastActiveAt!).getTime()) / 1000)
        timeSpent += additionalTime
      }

      // Calculate remaining time
      const totalDuration = Math.floor((expiresAt.getTime() - startedAt.getTime()) / 1000)
      const timeRemaining = Math.max(0, totalDuration - timeSpent)

      // Calculate progress percentage
      const percentage = Math.min(100, (timeSpent / totalDuration) * 100)

      // Check if expired
      const isExpired = now > expiresAt || timeRemaining <= 0

      return {
        timeRemaining,
        totalDuration,
        timeSpent,
        percentage,
        isExpired,
        canPause: session.status === 'active' && !isExpired,
        canResume: session.status === 'paused' && !isExpired
      }
    } catch (error) {
      console.error("Error getting session time info:", error)
      throw error
    }
  }

  /**
   * Check and expire sessions that have exceeded their time limit
   */
  async expireOverdueSessions(): Promise<void> {
    try {
      const now = new Date()

      await db
        .update(labProgressSessions)
        .set({
          status: 'expired',
          endedAt: now,
          updatedAt: now
        })
        .where(and(
          eq(labProgressSessions.status, 'active'),
          // Sessions where current time is past expiration
        ))
    } catch (error) {
      console.error("Error expiring overdue sessions:", error)
      throw error
    }
  }
}

export const labSessionService = new LabSessionService()
