import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Express middleware for JWT authentication
 * Validates Authorization header and attaches user info to request
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const user = JWTService.validateAuthHeader(authHeader);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Attach user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('HTTP authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const user = JWTService.validateAuthHeader(authHeader);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without user info
  }
};

/**
 * Admin-only middleware (requires authentication + admin role)
 */
export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, (err) => {
    if (err) return;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  });
};
