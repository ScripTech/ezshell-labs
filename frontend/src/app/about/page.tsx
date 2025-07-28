import { getMarkdownContent } from '@/utils/markdown'
import { LegalPageLayout } from '@/components/layouts/legal-page-layout'

export default async function AboutPage() {
  const { content, data } = await getMarkdownContent('about.md')

  return (
    <LegalPageLayout
      title="About EZShell Labs"
      content={content}
      lastUpdated={data.lastUpdated || 'January 2025'}
    />
  )
}
