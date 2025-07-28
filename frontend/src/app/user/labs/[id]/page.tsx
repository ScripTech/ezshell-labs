import type { Metadata } from 'next';
import { LabDetails } from './LabDetails';

export const metadata: Metadata = {
  title: 'Lab Details | EzShell',
  description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
  openGraph: {
    title: 'Lab Details | EzShell',
    description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    url: 'https://ezshelllabs.com/user/labs/[id]',
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
    title: 'Lab Details | EzShell',
    description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};

export default function Page() {
  return (
    <LabDetails/>
  );
}
