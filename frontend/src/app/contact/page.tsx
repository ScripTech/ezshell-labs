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
