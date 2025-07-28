import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | EzShell',
  description: 'Contact the EzShell Labs team for support, partnership, or general inquiries. We are here to help you succeed in your cloud learning journey.',
  openGraph: {
    title: 'Contact | EzShell',
    description: 'Contact the EzShell Labs team for support, partnership, or general inquiries. We are here to help you succeed in your cloud learning journey.',
    url: 'https://ezshelllabs.com/contact',
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
    title: 'Contact | EzShell',
    description: 'Contact the EzShell Labs team for support, partnership, or general inquiries. We are here to help you succeed in your cloud learning journey.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};
import { getMarkdownContent } from '@/utils/markdown'
import { LegalPageLayout } from '@/components/layouts/legal-page-layout'

export default async function ContactPage() {
  const { content, data } = await getMarkdownContent('contact.md')

  return (
    <LegalPageLayout
      title="Contact Us"
      content={content}
      lastUpdated={data.lastUpdated || 'January 2025'}
    />
  )
}
