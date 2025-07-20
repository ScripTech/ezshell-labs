"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  Terminal,
  Server,
  Clock,
  Shield,
  Zap,
  Award,
  Users,
  TrendingUp
} from 'lucide-react'

interface ComparisonItem {
  feature: string
  ezshell: boolean | string
  traditional: boolean | string
  icon: React.ElementType
}

const comparisons: ComparisonItem[] = [
  {
    feature: "Real AWS EC2 Instances",
    ezshell: true,
    traditional: false,
    icon: Server
  },
  {
    feature: "Live SSH Terminal Access",
    ezshell: true,
    traditional: false,
    icon: Terminal
  },
  {
    feature: "Real-time Command Validation",
    ezshell: true,
    traditional: "Limited",
    icon: Check
  },
  {
    feature: "Persistent Configurations",
    ezshell: true,
    traditional: false,
    icon: Shield
  },
  {
    feature: "Setup Time Required",
    ezshell: "< 7 minutes",
    traditional: "30+ minutes",
    icon: Clock
  },
  {
    feature: "Enterprise Environment",
    ezshell: "CentOS 8 Stream",
    traditional: "Containers/VMs",
    icon: Server
  },
  {
    feature: "Exam-like Experience",
    ezshell: "100% authentic",
    traditional: "Simulated",
    icon: Award
  },
  {
    feature: "Cost per Lab Session",
    ezshell: "$5.99",
    traditional: "$15-50",
    icon: TrendingUp
  }
]

const benefits = [
  {
    icon: Zap,
    title: "Instant Provisioning",
    description: "Lab environments ready in under 60 seconds with zero configuration",
    color: "text-yellow-400"
  },
  {
    icon: Shield,
    title: "Enterprise Grade",
    description: "Same infrastructure used by Fortune 500 companies for production workloads",
    color: "text-blue-400"
  },
  {
    icon: Users,
    title: "Collaborative Learning",
    description: "Share lab environments with team members and mentors",
    color: "text-green-400"
  },
  {
    icon: Award,
    title: "Certification Ready",
    description: "Practice on the exact same systems you'll use in certification exams",
    color: "text-purple-400"
  }
]

export function ComparisonSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'comparison' | 'benefits'>('comparison')
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

  const renderValue = (value: boolean | string, isEzshell: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`w-5 h-5 ${isEzshell ? 'text-green-400' : 'text-green-500'}`} />
      ) : (
        <X className="w-5 h-5 text-red-400" />
      )
    }
    return (
      <span className={`font-medium ${
        isEzshell ? 'text-green-400' : 'text-slate-400'
      }`}>
        {value}
      </span>
    )
  }

  return (
    <section ref={sectionRef} className="py-24 bg-slate-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real Infrastructure vs{' '}
              <span className="text-slate-500 line-through">Simulations</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              See why 95% of our students pass their certification exams on the first try.
              It&apos;s because they practice on real systems, not simulations.
            </p>

            {/* Tab Navigation */}
            <div className="inline-flex bg-slate-900/50 rounded-lg p-1 backdrop-blur-sm">
              <button
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'comparison'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('comparison')}
              >
                Feature Comparison
              </button>
              <button
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'benefits'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('benefits')}
              >
                Key Benefits
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'comparison' && (
          <div className={`transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Comparison Table */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl max-w-4xl mx-auto">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white">
                  ezShell Labs vs Traditional Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="text-slate-400 font-medium">Feature</div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold text-lg">ezShell Labs</div>
                      <div className="text-sm text-slate-400">Real Infrastructure</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 font-bold text-lg">Traditional</div>
                      <div className="text-sm text-slate-500">Simulated/Containers</div>
                    </div>
                  </div>

                  {/* Comparison Rows */}
                  {comparisons.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-3 gap-4 p-6 border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors duration-300 ${
                          isVisible
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-4'
                        }`}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-200 font-medium">{item.feature}</span>
                        </div>
                        <div className="flex justify-center items-center">
                          {renderValue(item.ezshell, true)}
                        </div>
                        <div className="flex justify-center items-center">
                          {renderValue(item.traditional, false)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bottom CTA */}
                <div className="p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-t border-slate-700/50">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-2">
                      Experience the difference for yourself
                    </h3>
                    <p className="text-slate-300 mb-4">
                      Start with a free trial and see why real infrastructure makes all the difference
                    </p>
                    <Button
                      // on click, navigate to the signup page
                      onClick={() => window.location.href = '/auth/login'}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Start Free Trial
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className={`transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <Card
                    key={index}
                    className={`bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/50 transition-all duration-500 ${
                      isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-slate-800/50 ${benefit.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-3">
                            {benefit.title}
                          </h3>
                          <p className="text-slate-300 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Success Story */}
            <div className={`mt-16 text-center transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl max-w-4xl mx-auto">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      95% First-Time Pass Rate
                    </h3>
                    <p className="text-lg text-slate-300 mb-6 max-w-2xl mx-auto">
                      "                      &quot;After failing the RHCSA exam twice with other platforms, I passed on my first try
                      after using ezShell Labs. The real environment made all the difference.&quot;"
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                      <span>Sarah M., DevOps Engineer</span>
                      <span>•</span>
                      <span>Microsoft</span>
                      <span>•</span>
                      <span>RHCSA Certified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
