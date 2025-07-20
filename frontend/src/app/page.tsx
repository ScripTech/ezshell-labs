"use client"

import React from 'react'
import { HeroSection } from '@/components/landing/hero-section'
import { ComparisonSection } from '@/components/landing/comparison-section'
import { CTASection } from '@/components/landing/cta-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { FooterSection } from '@/components/landing/footer-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section with Interactive Terminal */}
      <HeroSection />

      {/* Features Showcase */}
      <FeaturesSection />

      {/* Real vs Simulated Comparison */}
      <ComparisonSection />

      {/* Social Proof & Testimonials */}
      <TestimonialsSection />

      {/* Pricing Tiers */}
      {/* <PricingSection /> */}

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  )
}
