import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Labs | EzShell',
  description: 'Browse and enroll in hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
  openGraph: {
    title: 'Labs | EzShell',
    description: 'Browse and enroll in hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    url: 'https://ezshelllabs.com/user/labs',
    siteName: 'EzShell',
    images: [
      {
        url: 'https://emucanze.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'EzShell Open Graph Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Labs | EzShell',
    description: 'Browse and enroll in hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.svg'],
  },
};

import { Suspense } from "react";
import { UserLabsContent } from "./UserLabsContent";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingFallback() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Labs</h1>
        <p className="text-muted-foreground">
          Browse and enroll in available hands-on labs
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function UserLabs() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UserLabsContent />
    </Suspense>
  )
}
