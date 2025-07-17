import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the token data (not the raw JWT)
    const tokenData = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!tokenData) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    console.log('Token data from NextAuth:', JSON.stringify(tokenData, null, 2));

    // Create our own JWT token using the same secret and data
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    console.log('Frontend JWT - Secret length:', secret.length);
    console.log('Frontend JWT - Secret first 10 chars:', secret.substring(0, 10));

    const payload = {
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };

    console.log('JWT payload being signed:', JSON.stringify(payload, null, 2));

    const customToken = jwt.sign(payload, secret);

    console.log('Generated custom token for socket auth:', customToken.substring(0, 50) + '...');
    console.log('FULL TOKEN FOR DEBUGGING:', customToken);

    return NextResponse.json({
      token: customToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      }
    });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication token' },
      { status: 500 }
    );
  }
}
