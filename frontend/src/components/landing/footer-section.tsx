"use client"

import React from 'react'
import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, MapPin, Phone, ExternalLink } from 'lucide-react'

export function FooterSection() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Lab Catalog", href: "/labs" },
        { name: "Certification Tracks", href: "/certifications" },
        { name: "Mook Exams Labs", href: "/mock-labs" },
        { name: "Documentation", href: "/docs" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Getting Started", href: "/getting-started" },
        { name: "Study Guides", href: "/guides" },
        { name: "Blog", href: "/blog" },
        { name: "Webinars", href: "/webinars" },
        { name: "Community", href: "/community" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Partners", href: "/partners" },
        { name: "Press Kit", href: "/press" },
        { name: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "System Status", href: "/status" },
        { name: "Report Issue", href: "/support" },
        { name: "Feature Requests", href: "/feedback" },
        { name: "Enterprise Support", href: "/enterprise-support" }
      ]
    }
  ]

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/ezshell-labs" },
    // { name: "Twitter", icon: Twitter, href: "https://twitter.com/ezshelllabs" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/edilson-d-mucanze-550707b8/" },
    { name: "Email", icon: Mail, href: "mailto:hello@ezshelllabs.com" }
  ]

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security", href: "/security" },
  ]

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Top Section */}
        <div className="grid lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                EzShell Labs
              </h3>
              <p className="text-slate-400 mb-4">
                Real infrastructure for hands-on cloud learning.
                Master Linux, OpenShift, and cloud technologies with
                authentic lab experiences.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Maputo, MZ</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Mail className="w-4 h-4" />
                <a href="mailto:ezshell.labs@emucanze.com" className="text-sm hover:text-white transition-colors">
                  ezshell.labs@emucanze.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+258 86 690 9777</span>
                <span className="text-sm">+258 84 821 3574</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-300 group"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors duration-300 text-sm flex items-center gap-1 group"
                    >
                      {link.name}
                      {link.href.startsWith('http') && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-slate-400 text-sm text-center md:text-left">
              © {currentYear} ezShell Labs, Inc. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
