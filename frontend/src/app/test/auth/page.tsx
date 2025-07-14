'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthenticatedValidationDemo } from '@/components/AuthenticatedValidationDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  return (
    <SessionProvider>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Authentication Integration Test</h1>
          <p className="text-muted-foreground">
            Test the complete authentication flow from NextAuth to Socket.IO validation
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Instructions</CardTitle>
              <CardDescription>
                Follow these steps to test the authentication integration:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure you are logged in (check user info below)</li>
                <li>Verify the socket connection status shows "Connected"</li>
                <li>Click "Validate File Permissions" to test task validation</li>
                <li>Watch the validation steps appear in real-time</li>
                <li>Check the validation result and progress tracking</li>
                <li>Use "Request Progress Summary" to test progress retrieval</li>
              </ol>
            </CardContent>
          </Card>

          <AuthenticatedValidationDemo />
        </div>
      </div>
    </SessionProvider>
  );
}
