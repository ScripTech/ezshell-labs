'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Lock, Mail, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { FooterSection } from '../landing/footer-section'

interface LegalPageLayoutProps {
  title: string
  content: string
  lastUpdated?: string
  children?: React.ReactNode
}

export function LegalPageLayout({ title, content, lastUpdated, children }: LegalPageLayoutProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // For SSR/Next.js, usePathname hook is preferred
  let currentPath = '';
  try {
    currentPath = usePathname ? usePathname() : pathname;
  } catch {
    currentPath = pathname;
  }

  const navLinks = [
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
    { href: '/security', label: 'Security', icon: Lock },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header - fixed at top */}
      <div className="fixed top-0 left-0 w-full z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to EZShell Labs
                </Button>
              </Link>
              <div className="h-6 border-l border-slate-300 dark:border-slate-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
            </div>
            {lastUpdated && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[88px] sm:h-[88px] lg:h-[88px]" />

      {/* Navigation sidebar and main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sticky sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="sticky top-[104px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Legal & Information
              </h3>
              <ul className="space-y-2">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = currentPath === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={
                          `flex items-center gap-2 text-sm transition-colors ` +
                          (isActive
                            ? 'text-slate-900 dark:text-white underline'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                        }
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            {children || <MarkdownRenderer content={content} />}
          </main>
        </div>
      </div>
      {/* Footer */}
      <FooterSection />
    </div>
  )
}
