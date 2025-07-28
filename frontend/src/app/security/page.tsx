import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | EzShell',
  description: 'Learn about the security measures and best practices EzShell Labs uses to keep your data and lab environments safe.',
  openGraph: {
    title: 'Security | EzShell',
    description: 'Learn about the security measures and best practices EzShell Labs uses to keep your data and lab environments safe.',
    url: 'https://ezshelllabs.com/security',
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
    title: 'Security | EzShell',
    description: 'Learn about the security measures and best practices EzShell Labs uses to keep your data and lab environments safe.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};
import { getMarkdownContent } from '@/utils/markdown'
import { LegalPageLayout } from '@/components/layouts/legal-page-layout'

export default async function SecurityPage() {
  const { content, data } = await getMarkdownContent('security.md')

  return (
    <LegalPageLayout
      title="Security Information"
      content={content}
      lastUpdated={data.lastUpdated || 'January 2025'}
    />
  )
}
