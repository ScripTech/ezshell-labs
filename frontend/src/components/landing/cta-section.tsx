"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Rocket, Shield, Zap, CheckCircle, Users, Globe } from 'lucide-react'

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const benefits = [
    {
      icon: Rocket,
      title: "Launch in Seconds",
      description: "Real AWS instances ready in under 5 minutes"
    },
    {
      icon: Shield,
      title: "100% Secure",
      description: "Isolated environments with enterprise-grade security"
    },
    {
      icon: Zap,
      title: "Real Infrastructure",
      description: "No simulations - practice on actual cloud resources"
    }
  ]

  const stats = [
    { value: "95%", label: "Pass Rate", sublabel: "certification success" },
    { value: "0.5K+", label: "Engineers", sublabel: "trained successfully" },
    { value: "4.5/5", label: "Rating", sublabel: "from our users" }
  ]

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Main CTA Card */}
        <Card
          className="relative max-w-5xl mx-auto bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 backdrop-blur-xl overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          {/* Interactive gradient overlay */}
          <div
            className="absolute inset-0 opacity-20 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3), transparent 40%)`
            }}
          />

          <CardContent className="relative p-12 md:p-16">
            <div className={`text-center transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                  Trusted by 500+ Engineers
                </span>
              </div>

              {/* Main Headline */}
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Ready to Master{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Real Cloud Skills?
                </span>
              </h2>

              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                Join engineers who&apos;ve advanced their careers with hands-on labs
                on real AWS infrastructure. Start your journey today.
              </p>

              {/* Benefits Grid */}
              <div className={`grid md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
                      <p className="text-sm text-slate-400">{benefit.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-1000 delay-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <Button
                  onClick={() => window.location.href = '/auth/login'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-medium group">
                  Start Free Labs
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
                  View Pricing
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className={`flex flex-col sm:flex-row items-center justify-center gap-8 text-center transition-all duration-1000 delay-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                {stats.map((stat, index) => (
                  <div key={index} className="group">
                    <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {stat.label}
                      <br />
                      <span className="text-xs">{stat.sublabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary CTA Section */}
        <div className={`mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-900 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Enterprise CTA */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-orange-500/30 transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise Teams</h3>
              <p className="text-slate-400 mb-4">
                Custom solutions for organizations training multiple engineers
              </p>
              <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                Contact Sales
              </Button>
            </CardContent>
          </Card>

          {/* Partner CTA */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-green-500/30 transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Training Partners</h3>
              <p className="text-slate-400 mb-4">
                Join our partner network and offer real-world lab experiences
              </p>
              <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                Become a Partner
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Final Assurance */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-1100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-slate-400 text-sm">
            ✨ No credit card required for free plan • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  )
}
