import { Socket } from 'socket.io';
import { JWTService, JWTPayload } from '../utils/jwt';

export interface AuthenticatedSocket extends Socket {
  user?: JWTPayload;
}

export interface SocketAuthData {
  token?: string;
}

/**
 * Socket.IO authentication middleware
 * Validates JWT token and attaches user info to socket
 */
export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;

    console.log('Socket auth attempt - Token received:', token ? `${token.substring(0, 20)}...` : 'none');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const user = JWTService.verifyToken(token);
    if (!user) {
      console.error('JWT verification failed: Invalid token');
      return next(new Error('Invalid or expired authentication token'));
    }

    // Attach user info to socket
    socket.user = user;
    console.log(`Socket authenticated for user: ${user.sub} (${user.email})`);

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

/**
 * Extract user ID from authenticated socket
 */
export const getUserIdFromSocket = (socket: AuthenticatedSocket): string | null => {
  return socket.user?.sub || null;
};

/**
 * Extract full user info from authenticated socket
 */
export const getUserFromSocket = (socket: AuthenticatedSocket): JWTPayload | null => {
  return socket.user || null;
};
