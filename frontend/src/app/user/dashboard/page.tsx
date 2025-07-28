import type { Metadata } from 'next';
import { UserDashboardPage } from './UserDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | EzShell',
  description: 'Track your progress, skills, and completed labs on your personalized dashboard. Real infrastructure. Real learning.',
  openGraph: {
    title: 'Dashboard | EzShell',
    description: 'Track your progress, skills, and completed labs on your personalized dashboard. Real infrastructure. Real learning.',
    url: 'https://ezshelllabs.com/user/dashboard',
    siteName: 'EzShell',
    images: [
      {
        url: 'https://emucanze.com/og-image.png',
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
    title: 'Dashboard | EzShell',
    description: 'Track your progress, skills, and completed labs on your personalized dashboard. Real infrastructure. Real learning.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};

export default function Page() {
  return (
    <UserDashboardPage />
  );
}
