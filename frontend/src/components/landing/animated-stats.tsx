"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Users, Award, Clock, TrendingUp, Server, Shield } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

interface StatItem {
  icon: React.ElementType
  value: number | string
  suffix?: string
  label: string
  description: string
  color: string
  gradient: string
}

const stats: StatItem[] = [
  {
    icon: Users,
    value: 500,
    suffix: "+",
    label: "Active Engineers",
    description: "Professionals actively learning",
    color: "text-blue-400",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Award,
    value: 95,
    suffix: "%",
    label: "Pass Rate",
    description: "Certification success rate",
    color: "text-green-400",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Clock,
    value: "1.7hr",
    label: "Avg Lab Time",
    description: "Time per session",
    color: "text-purple-400",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Server,
    value: 100,
    suffix: "+",
    label: "Daily Labs",
    description: "AWS instances provisioned",
    color: "text-orange-400",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: TrendingUp,
    value: "82.9%",
    label: "Uptime",
    description: "Platform reliability",
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    icon: Shield,
    value: "24/7",
    label: "Support",
    description: "Always available help",
    color: "text-indigo-400",
    gradient: "from-indigo-500 to-purple-500"
  }
]

// Simple counter hook for animation
function useCountUp(target: number, duration: number, shouldStart: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(target * easeOutQuart))

      if (progress === 1) {
        clearInterval(interval)
        setCount(target)
      }
    }, 16)

    return () => clearInterval(interval)
  }, [target, duration, shouldStart])

  return count
}

interface StatItemProps {
  stat: StatItem
  index: number
  isVisible: boolean
  startAnimation: boolean
}

function StatItem({ stat, index, isVisible, startAnimation }: StatItemProps) {
  const Icon = stat.icon
  const numericValue = typeof stat.value === 'number' ? stat.value : 0
  const animatedValue = useCountUp(numericValue, 2000, startAnimation)

  return (
    <Card
      className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 group ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
      style={{
        transitionDelay: `${index * 150}ms`,
        animationDelay: `${index * 150}ms`
      }}
    >
      <CardContent className="p-6 text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">
            {typeof stat.value === 'number' ? animatedValue.toLocaleString() : stat.value}
            {stat.suffix && <span className={stat.color}>{stat.suffix}</span>}
          </div>
          <h3 className="font-semibold text-white text-sm">
            {stat.label}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {stat.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnimatedStats() {
  const [isVisible, setIsVisible] = useState(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setTimeout(() => setStartAnimation(true), 500)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-16 bg-slate-900 rounded-md px-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Developed by Engineers to Engineers Worldwide
          </h2>
          <p className={`text-lg text-slate-300 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Join professionals who&apos;ve accelerated their careers with real hands-on experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              stat={stat}
              index={index}
              isVisible={isVisible}
              startAnimation={startAnimation}
            />
          ))}
        </div>

        {/* Company Logos */}
        <div className={`mt-16 transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-center text-slate-400 text-sm mb-8">
            Trusted by engineers at
          </p>

          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap opacity-60">
            {/* Company logos would go here */}
            <div className="text-slate-500 font-bold text-lg">Algoritimo</div>
            <div className="text-slate-500 font-bold text-lg">EzShell Labs</div>
            <div className="text-slate-500 font-bold text-lg">Infopel</div>
          </div>
        </div>
      </div>
    </section>
  )
}
