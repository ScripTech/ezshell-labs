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
