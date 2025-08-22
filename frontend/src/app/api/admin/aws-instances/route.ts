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

    // Fetch instances from lab-provisioner service
    const response = await fetch(`${LAB_PROVISIONER_URL}/api/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lab provisioner service error: ${response.status}`);
    }

    const instances = await response.json();

    return NextResponse.json(instances);
  } catch (error) {
    console.error('Error fetching AWS instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Terminate instance via lab-provisioner service
    const response = await fetch(
      `${LAB_PROVISIONER_URL}/api/instances/${instanceId}/terminate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId: instanceId,
          force: false, // Default to false for safety
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Lab provisioner service error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error terminating AWS instance:', error);
    return NextResponse.json(
      { error: 'Failed to terminate instance' },
      { status: 500 }
    );
  }
}
