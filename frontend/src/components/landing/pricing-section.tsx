"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Crown, Rocket } from 'lucide-react'

interface PricingPlan {
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular?: boolean
  icon: React.ElementType
  color: string
  gradient: string
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for getting started with hands-on labs",
    features: [
      "3 lab sessions per month",
      "Basic validation feedback",
      "Community support",
      "Access to EX200 labs",
      "30-minute sessions"
    ],
    icon: Zap,
    color: "text-blue-400",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    name: "Professional",
    price: 29,
    period: "month",
    description: "Best for serious learners and certification candidates",
    features: [
      "Unlimited lab sessions",
      "Advanced validation & analytics",
      "Priority support",
      "All certification tracks",
      "2-hour sessions",
      "Lab session recordings",
      "Progress tracking"
    ],
    popular: true,
    icon: Crown,
    color: "text-purple-400",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Enterprise",
    price: 99,
    period: "month",
    description: "Perfect for teams and organizations",
    features: [
      "Everything in Professional",
      "Team management dashboard",
      "Custom lab environments",
      "Dedicated support",
      "SSO integration",
      "Bulk user management",
      "Advanced reporting"
    ],
    icon: Rocket,
    color: "text-orange-400",
    gradient: "from-orange-500 to-red-500"
  }
]

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
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

  const getPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 0
    return billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price
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
              Simple, Transparent{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Start free, scale as you grow. No hidden fees, no setup costs.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex bg-slate-900/50 rounded-lg p-1 backdrop-blur-sm">
              <button
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  20% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = getPrice(plan)

            return (
              <Card
                key={index}
                className={`relative transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/50 ring-2 ring-purple-500/30'
                    : 'bg-slate-900/50 border-slate-700/50'
                } backdrop-blur-xl ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4 mx-auto`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">
                    {plan.name}
                  </CardTitle>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${price}
                      </span>
                      <span className="text-slate-400">
                        /{plan.period === 'forever' ? plan.period : billingCycle.slice(0, -2)}
                      </span>
                    </div>

                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <div className="text-sm text-green-400">
                        Save ${plan.price * 12 - price * 12}/year
                      </div>
                    )}
                  </div>

                  <p className="text-slate-300 mt-4">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <Button
                      className={`w-full py-3 font-medium transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          : plan.price === 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {plan.price === 0 ? 'Start Free' : 'Get Started'}
                    </Button>
                  </div>

                  {plan.price === 0 && (
                    <p className="text-xs text-slate-400 text-center">
                      No credit card required
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className={`mt-20 text-center transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h3 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h3>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Can I cancel anytime?</h4>
              <p className="text-slate-300 text-sm">
                Yes, you can cancel your subscription at any time. No long-term commitments.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">What payment methods do you accept?</h4>
              <p className="text-slate-300 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for enterprise plans.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Is there a free trial?</h4>
              <p className="text-slate-300 text-sm">
                Yes! Our Starter plan is free forever with 3 lab sessions per month.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Do you offer student discounts?</h4>
              <p className="text-slate-300 text-sm">
                Yes, we offer 50% off for students with a valid .edu email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
