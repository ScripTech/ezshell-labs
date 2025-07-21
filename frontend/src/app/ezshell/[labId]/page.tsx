import React, { Suspense } from 'react'
import { EZSShellClient } from './EZSShellClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="container-shell flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
)

const EZSShellView = () => {
  return <EZSShellClient />
}

export default EZSShellView
