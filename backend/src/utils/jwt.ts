import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

export class JWTService {
  private static getSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key';
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    return secret;
  }

  /**
   * Verify JWT token from NextAuth
   * This should match the same secret used by NextAuth in the frontend
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const secret = this.getSecret();
      console.log('JWT verification attempt - Token length:', token.length);
      console.log('JWT verification attempt - Token format:', token.startsWith('ey') ? 'JWT format' : 'Unknown format');
      console.log('JWT verification attempt - Secret available:', !!secret);
      console.log('JWT verification attempt - Secret length:', secret.length);
      console.log('JWT verification attempt - Secret first 10 chars:', secret.substring(0, 10));

      const decoded = jwt.verify(token, secret) as JWTPayload;
      console.log('JWT verification successful for user:', decoded.sub);
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      console.error('Token that failed:', token.substring(0, 50) + '...');
      return null;
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    // Support both "Bearer token" and "token" formats
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return authHeader;
  }

  /**
   * Validate and extract user information from request headers
   */
  static validateAuthHeader(authHeader: string | undefined): JWTPayload | null {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) return null;

    return this.verifyToken(token);
  }
}
