import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | EzShell',
  description: 'Review the EzShell Labs terms of service to understand your rights and responsibilities when using our hands-on cloud labs platform.',
  openGraph: {
    title: 'Terms of Service | EzShell',
    description: 'Review the EzShell Labs terms of service to understand your rights and responsibilities when using our hands-on cloud labs platform.',
    url: 'https://ezshelllabs.com/terms',
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
    title: 'Terms of Service | EzShell',
    description: 'Review the EzShell Labs terms of service to understand your rights and responsibilities when using our hands-on cloud labs platform.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};
import { getMarkdownContent } from '@/utils/markdown'
import { LegalPageLayout } from '@/components/layouts/legal-page-layout'

export default async function TermsPage() {
  const { content, data } = await getMarkdownContent('terms.md')

  return (
    <LegalPageLayout
      title="Terms of Service"
      content={content}
      lastUpdated={data.lastUpdated || 'January 2025'}
    />
  )
}
