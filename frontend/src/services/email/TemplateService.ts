import Handlebars from 'handlebars'
import path from 'path'
import fs from 'fs/promises'
import { EmailTemplate } from './types/EmailTypes'

export class TemplateService {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map()
  private templatesPath: string
  private baseUrl: string

  constructor(templatesPath?: string, baseUrl?: string) {
    this.templatesPath = templatesPath || path.join(process.cwd(), 'src/services/email/templates')
    this.baseUrl = baseUrl || 'http://localhost:3003'
    this.registerHelpers()
  }

  private registerHelpers(): void {
    // Custom Handlebars helpers
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    Handlebars.registerHelper('formatTime', (date: string | Date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b)
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b)
    Handlebars.registerHelper('gte', (a: number, b: number) => a >= b)

    Handlebars.registerHelper('generateUrl', (path: string) => {
      return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
    })
  }

  async loadTemplate(template: EmailTemplate, type: 'html' | 'text' = 'html'): Promise<HandlebarsTemplateDelegate> {
    const cacheKey = `${template}-${type}`

    if (this.compiledTemplates.has(cacheKey)) {
      return this.compiledTemplates.get(cacheKey)!
    }

    try {
      const templatePath = path.join(this.templatesPath, `${template}.${type}.hbs`)
      const templateContent = await fs.readFile(templatePath, 'utf-8')
      const compiled = Handlebars.compile(templateContent)

      this.compiledTemplates.set(cacheKey, compiled)
      return compiled
    } catch (error) {
      console.error(`Failed to load template ${template}-${type}:`, error)
      throw new Error(`Template ${template}-${type} not found`)
    }
  }

  async renderTemplate(template: EmailTemplate, data: any, type: 'html' | 'text' = 'html'): Promise<string> {
    const compiledTemplate = await this.loadTemplate(template, type)

    // Add common data available to all templates
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      baseUrl: this.baseUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@ezshell.dev',
      companyName: 'EZShell Labs'
    }

    return compiledTemplate(templateData)
  }

  async validateTemplate(template: EmailTemplate): Promise<boolean> {
    try {
      await this.loadTemplate(template, 'html')
      return true
    } catch {
      return false
    }
  }

  async previewTemplate(template: EmailTemplate, data: any): Promise<{ html: string; text: string }> {
    const [html, text] = await Promise.all([
      this.renderTemplate(template, data, 'html').catch(() => '<p>HTML template not found</p>'),
      this.renderTemplate(template, data, 'text').catch(() => 'Text template not found')
    ])

    return { html, text }
  }

  clearCache(): void {
    this.compiledTemplates.clear()
  }

  async listAvailableTemplates(): Promise<EmailTemplate[]> {
    try {
      const files = await fs.readdir(this.templatesPath)
      const templateSet = new Set(
        files
          .filter(file => file.endsWith('.hbs'))
          .map(file => file.replace(/\.(html|text)\.hbs$/, ''))
      )
      const templateNames = Array.from(templateSet) as EmailTemplate[]

      return templateNames
    } catch (error) {
      console.error('Failed to list templates:', error)
      return []
    }
  }
}
