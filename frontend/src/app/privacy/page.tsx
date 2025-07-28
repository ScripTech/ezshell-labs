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
