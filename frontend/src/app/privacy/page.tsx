import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | EzShell',
  description: 'Read the EzShell Labs privacy policy to learn how we protect your data and respect your privacy as you use our hands-on cloud labs platform.',
  openGraph: {
    title: 'Privacy Policy | EzShell',
    description: 'Read the EzShell Labs privacy policy to learn how we protect your data and respect your privacy as you use our hands-on cloud labs platform.',
    url: 'https://ezshelllabs.com/privacy',
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
    title: 'Privacy Policy | EzShell',
    description: 'Read the EzShell Labs privacy policy to learn how we protect your data and respect your privacy as you use our hands-on cloud labs platform.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};
import { getMarkdownContent } from '@/utils/markdown'
import { LegalPageLayout } from '@/components/layouts/legal-page-layout'

export default async function PrivacyPage() {
  const { content, data } = await getMarkdownContent('privacy.md')

  return (
    <LegalPageLayout
      title="Privacy Policy"
      content={content}
      lastUpdated={data.lastUpdated || 'January 2025'}
    />
  )
}
