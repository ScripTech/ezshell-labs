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
