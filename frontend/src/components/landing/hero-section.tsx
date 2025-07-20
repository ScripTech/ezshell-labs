"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Terminal, CheckCircle, Clock, Users, Award, ArrowRight, Play } from 'lucide-react'
import { AnimatedStats } from './animated-stats'
import { InteractiveTerminal } from './interactive-terminal'
import { TechStack } from './tech-stack'


export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    { icon: Terminal, text: "Real AWS EC2 Instances" },
    { icon: CheckCircle, text: "Live Validation" },
    { icon: Clock, text: "Real-time Feedback" },
  ]

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* Left Side - Hero Content */}
          <div className={`space-y-8 ${isVisible ? 'animate-in slide-in-from-left duration-1000' : 'opacity-0'}`}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Real Infrastructure • Live Now
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Master{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Linux & OpenShift
                </span>
                <br />
                on Real AWS Infrastructure
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-2xl">
                Practice on live systems with instant validation — just like the real certification exam.
                No simulations, no containers, just{' '}
                <span className="text-blue-400 font-semibold">real cloud infrastructure</span>.
              </p>
            </div>

            {/* Rotating Features */}
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-500 ${
                      index === currentFeature
                        ? 'bg-blue-500/20 text-blue-400 scale-105'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium whitespace-nowrap">{feature.text}</span>
                  </div>
                )
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => window.location.href = '/auth/login'}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl backdrop-blur-sm transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-6 text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">10,000+ Engineers</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="text-sm">95% Pass Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Red Hat Certified</span>
              </div>
            </div>
          </div>

          {/* Right Side - Interactive Terminal */}
          <div className={`${isVisible ? 'animate-in slide-in-from-right duration-1000 delay-300' : 'opacity-0'}`}>
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-0">
                <InteractiveTerminal />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Animated Stats & Tech Stack */}
        <div className={`mt-20 space-y-12 ${isVisible ? 'animate-in fade-in duration-1000 delay-700' : 'opacity-0'}`}>
          <AnimatedStats />
          <TechStack />
        </div>
      </div>
    </section>
  )
}
