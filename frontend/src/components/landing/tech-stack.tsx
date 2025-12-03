"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface TechLogo {
  name: string
  logo: string
  color: string
  description: string
}

const technologies: TechLogo[] = [
  {
    name: "Linux",
    logo: "/assets/tech-icons/Linux.png",
    color: "from-gray-700 to-gray-900",
    description: "System Admin"
  },
  {
    name: "Docker",
    logo: "/assets/tech-icons/Docker.svg",
    color: "from-blue-400 to-blue-600",
    description: "Containerization"
  },
  {
    name: "OpenShift",
    logo: "/assets/tech-icons/Red-Hat.svg",
    color: "from-red-500 to-purple-600",
    description: "Container Platform"
  },
  {
    name: "Kubernetes",
    logo: "/assets/tech-icons/Kubernetes.svg",
    color: "from-blue-500 to-cyan-500",
    description: "Orchestration"
  },
  {
    name: "Ansible",
    logo: "/assets/tech-icons/Ansible.png",
    color: "from-red-500 to-orange-500",
    description: "Automation"
  }
]

const certifications = [
  {
    name: "RHCSA",
    code: "EX200",
    description: "Red Hat Certified System Administrator",
    color: "from-red-500 to-red-600",
    labs: 45
  },
  {
    name: "RHCE",
    code: "EX294",
    description: "Red Hat Certified Engineer",
    color: "from-red-600 to-red-700",
    labs: 32
  },
  {
    name: "OpenShift Admin",
    code: "EX280",
    description: "Red Hat Certified OpenShift Administrator",
    color: "from-purple-500 to-red-500",
    labs: 28
  },
  {
    name: "OpenShift Dev",
    code: "DO280",
    description: "OpenShift Container Platform Development",
    color: "from-blue-500 to-purple-500",
    labs: 35
  }
]

export function TechStack() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredTech, setHoveredTech] = useState<string | null>(null)
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

  return (
    <div ref={sectionRef} className="w-full space-y-16">
      {/* Technologies Section */}
      <div className="text-center">
        <h3 className={`text-2xl md:text-3xl font-bold text-white mb-8 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          Master Industry-Leading Technologies
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {technologies.map((tech, index) => (
            <div
              key={tech.name}
              className={`relative group cursor-pointer transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredTech(tech.name)}
              onMouseLeave={() => setHoveredTech(null)}
            >
              <div className={`relative p-6 rounded-2xl h-32 bg-gradient-to-br ${tech.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                  <Image
                    src={tech.logo}
                    alt={tech.name}
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="text-white font-semibold text-sm mb-1">{tech.name}</div>
                <div className="text-slate-400 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {tech.description}
                </div>
              </div>

              {/* Hover Effect */}
              {hoveredTech === tech.name && (
                <div className="absolute -top-2 -left-2 -right-2 -bottom-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Certifications Section */}

    </div>
  )
}
