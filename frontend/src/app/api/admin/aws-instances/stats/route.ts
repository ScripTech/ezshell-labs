import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const LAB_PROVISIONER_URL = process.env.LAB_PROVISIONER_URL || 'http://localhost:3002';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch stats from lab-provisioner service
    const response = await fetch(`${LAB_PROVISIONER_URL}/api/instances/stats/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lab provisioner service error: ${response.status}`);
    }

    const stats = await response.json();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching AWS instance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
