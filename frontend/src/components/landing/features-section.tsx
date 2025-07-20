"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Terminal,
  CheckCircle,
  Clock,
  Users,
  Award,
  Zap,
  Shield,
  BarChart3,
  PlayCircle,
  Sparkles,
  Globe,
  Cpu
} from 'lucide-react'

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  details: string[]
  color: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Terminal,
    title: "Real AWS Infrastructure",
    description: "Practice on actual EC2 instances, not containers or simulators",
    details: [
      "Live CentOS 8 Stream instances",
      "Real systemd services and networking",
      "Persistent storage and configurations",
      "Authentic enterprise environment"
    ],
    color: "text-orange-400",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    icon: CheckCircle,
    title: "Instant Validation",
    description: "Get real-time feedback on every command and configuration",
    details: [
      "Step-by-step command validation",
      "Configuration file verification",
      "Service status monitoring",
      "Automatic progress tracking"
    ],
    color: "text-green-400",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your progress with detailed learning insights",
    details: [
      "Command execution analytics",
      "Time-to-completion metrics",
      "Error pattern analysis",
      "Skill progression tracking"
    ],
    color: "text-blue-400",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Instant Provisioning",
    description: "Lab environments ready in under 60 seconds",
    details: [
      "One-click environment creation",
      "Pre-configured lab scenarios",
      "Automatic cleanup after sessions",
      "Zero setup time required"
    ],
    color: "text-purple-400",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Award,
    title: "Certification Ready",
    description: "Aligned with official Red Hat certification exams",
    details: [
      "RHCSA (EX200) preparation",
      "RHCE (EX294) scenarios",
      "OpenShift (EX280) labs",
      "Real exam-like conditions"
    ],
    color: "text-red-400",
    gradient: "from-red-500 to-red-600"
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description: "Multi-region AWS deployment for optimal performance",
    details: [
      "Multiple AWS regions available",
      "Low-latency connections worldwide",
      "99.9% uptime guarantee",
      "24/7 infrastructure monitoring"
    ],
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-blue-500"
  }
]

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
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

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Why ezShell Labs is Different
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real Infrastructure,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Real Learning
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Master Linux and Cloud on real infrastructure.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isActive = index === activeFeature

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-500 ${
                    isActive
                      ? 'bg-white/10 border-white/20 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/8'
                  } ${
                    isVisible
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.gradient} ${
                        isActive ? 'scale-110' : 'scale-100'
                      } transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          isActive ? 'text-white' : 'text-slate-200'
                        }`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}>
                          {feature.description}
                        </p>

                        {/* Feature Details - Only show for active */}
                        {isActive && (
                          <div className="space-y-2 animate-in slide-in-from-top duration-300">
                            {feature.details.map((detail, detailIndex) => (
                              <div key={detailIndex} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-slate-300">{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isActive && (
                        <div className="animate-pulse">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Feature Showcase */}
          <div className={`transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-8">
                {/* Dynamic Feature Display */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${features[activeFeature].gradient} mb-6`}>
                    {React.createElement(features[activeFeature].icon, {
                      className: "w-10 h-10 text-white"
                    })}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-slate-300">
                    {features[activeFeature].description}
                  </p>
                </div>

                {/* Interactive Demo Area */}
                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-400">Live Demo</div>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Try Now
                    </Button>
                  </div>

                  {/* Demo Content Based on Active Feature */}
                  <div className="space-y-3">
                    {activeFeature === 0 && (
                      <div className="font-mono text-sm text-green-400">
                        <div>$ cat /etc/redhat-release</div>
                        <div className="text-slate-300">CentOS Stream release 8</div>
                        <div>$ systemctl status httpd</div>
                        <div className="text-slate-300">● httpd.service - The Apache HTTP Server</div>
                        <div className="text-slate-300">   Active: active (running)</div>
                      </div>
                    )}

                    {activeFeature === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">Command executed successfully</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">Configuration validated</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300">Progress: 75% complete</span>
                        </div>
                      </div>
                    )}

                    {activeFeature === 2 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Commands executed:</span>
                          <span className="text-white">247</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Success rate:</span>
                          <span className="text-green-400">94%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Avg completion time:</span>
                          <span className="text-blue-400">2.3hrs</span>
                        </div>
                      </div>
                    )}

                    {/* Default for other features */}
                    {activeFeature > 2 && (
                      <div className="text-center py-4">
                        <Cpu className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                          Interactive demo available in live environment
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Navigation Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === activeFeature
                          ? 'bg-blue-400 scale-125'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      onClick={() => setActiveFeature(index)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to experience the difference?
          </h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Join engineers who&apos;ve accelerated their careers with real hands-on experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/auth/login'}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
