"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  name: string
  role: string
  company: string
  avatar: string
  content: string
  rating: number
  certification: string
}

const testimonials: Testimonial[] = [
  {
    name: "Edson Maumane",
    role: "System Administrator",
    company: "Standard Bank Mozambique",
    avatar: "👨‍🔧",
    content: "The instant validation and real-time feedback helped me identify knowledge gaps immediately. Best investment for my career advancement.",
    rating: 5,
    certification: "RHCE"
  },
  {
    name: "Edilson D Mucanze",
    role: "Founder & Developer of eZShell Labs",
    company: "eMucanze Tech",
    avatar: "👨‍💻",
    content: "ezShell Labs gave me hands-on experience with real AWS infrastructure. I passed my RHCSA and RHCOA on the first try thanks to their authentic lab environment.",
    rating: 5,
    certification: "RHCSA, RHCOA"
  }
]

export function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
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

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section ref={sectionRef} className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Success Stories from{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Real Engineers
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Join professionals who&apos;ve accelerated their careers with ezShell Labs
            </p>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-8 md:p-12">
              <div className="text-center">
                <Quote className="w-12 h-12 text-blue-400 mx-auto mb-6" />

                <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
                  {testimonials[currentIndex].content}
                </blockquote>

                {/* Rating */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-4xl">{testimonials[currentIndex].avatar}</div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-slate-400">
                      {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                    </div>
                    <div className="text-sm text-blue-400 font-medium">
                      {testimonials[currentIndex].certification} Certified
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevTestimonial}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'bg-blue-400 scale-125'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextTestimonial}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">95%</div>
            <div className="text-slate-300">First-time pass rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">0.5K+</div>
            <div className="text-slate-300">Engineers trained</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">4.5/5</div>
            <div className="text-slate-300">Average rating</div>
          </div>
        </div>
      </div>
    </section>
  )
}
