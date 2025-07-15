import { AuthenticatedSocket, getUserIdFromSocket, getUserFromSocket } from '../middleware/socketAuth';
import { db } from '../db';
import { labEnrollments } from '../db/schemas/LabSchema';
import { eq, and } from 'drizzle-orm';

export interface UserContextFromSocket {
  userId: string;
  labEnrollmentId?: string;
  userInfo: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

/**
 * Helper service to extract user context from authenticated sockets
 */
export class SocketUserService {

  /**
   * Extract user information from authenticated socket
   */
  static getUserContext(socket: AuthenticatedSocket): UserContextFromSocket | null {
    const userId = getUserIdFromSocket(socket);
    const userInfo = getUserFromSocket(socket);

    if (!userId || !userInfo) {
      return null;
    }

    return {
      userId,
      userInfo: {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        role: userInfo.role
      }
    };
  }

  /**
   * Get user's lab enrollment ID for a specific lab
   */
  static async getLabEnrollmentId(userId: string, labId: string): Promise<string | null> {
    try {
      const enrollment = await db.query.labEnrollments.findFirst({
        where: and(
          eq(labEnrollments.userId, userId),
          eq(labEnrollments.labId, labId)
        )
      });

      return enrollment?.id || null;
    } catch (error) {
      console.error('Error getting lab enrollment:', error);
      return null;
    }
  }

  /**
   * Get complete user context including lab enrollment
   */
  static async getUserContextWithLab(
    socket: AuthenticatedSocket,
    labId: string
  ): Promise<UserContextFromSocket | null> {
    const baseContext = this.getUserContext(socket);
    if (!baseContext) return null;
    console.log(
      "GetUserContextWithLab@getLabEnrollmentId for lab with parent id:",
      labId
    );
    const labEnrollmentId = await this.getLabEnrollmentId(baseContext.userId, labId);

    return {
      ...baseContext,
      labEnrollmentId: labEnrollmentId || undefined
    };
  }

  /**
   * Require authentication and return user context or throw error
   */
  static requireAuthentication(socket: AuthenticatedSocket): UserContextFromSocket {
    const context = this.getUserContext(socket);
    if (!context) {
      throw new Error('Authentication required');
    }
    return context;
  }
}
