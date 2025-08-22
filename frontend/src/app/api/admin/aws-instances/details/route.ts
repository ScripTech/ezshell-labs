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

    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('instanceId');

    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
    }

    // Fetch instance details from lab-provisioner service
    const response = await fetch(`${LAB_PROVISIONER_URL}/api/instances/${instanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lab provisioner service error: ${response.status}`);
    }

    const details = await response.json();

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching AWS instance details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance details' },
      { status: 500 }
    );
  }
}
