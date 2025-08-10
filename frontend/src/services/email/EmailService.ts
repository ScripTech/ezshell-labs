import nodemailer from 'nodemailer'
import {
  EmailOptions,
  EmailResult,
  EmailServiceInterface,
  EmailRecipient,
  EmailTemplate,
  EmailConfig
} from './types/EmailTypes'
import { TemplateService } from './TemplateService'

export class EmailService implements EmailServiceInterface {
  private transporter: nodemailer.Transporter
  private templateService: TemplateService
  private config: EmailConfig

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      provider: "nodemailer",
      from: {
        email: process.env.EMAIL_FROM_ADDRESS || "noreply@ezshell.dev",
        name: process.env.EMAIL_FROM_NAME || "EZShell Labs",
      },
      nodemailer: {
        host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
        port: parseInt(process.env.SMTP_PORT || "2525"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_AUTH_USER || "dc09fe5d4c42af",
          pass: process.env.SMTP_AUTH_PASS || "",
        },
      },
      templates: {
        engine: "handlebars",
        baseUrl: process.env.BASE_URL || "http://localhost:3003",
      },
      features: {
        queue: process.env.EMAIL_QUEUE_ENABLED === "true",
        tracking: process.env.EMAIL_TRACKING_ENABLED === "true",
        debug: process.env.EMAIL_DEBUG_MODE === "true",
      },
      ...config,
    };
    this.transporter = this.createTransporter()
    this.templateService = new TemplateService(undefined, this.config.templates.baseUrl)
  }

  private createTransporter(): nodemailer.Transporter {
    if (this.config.provider === 'nodemailer' && this.config.nodemailer) {
      return nodemailer.createTransport({
        host: this.config.nodemailer.host,
        port: this.config.nodemailer.port,
        secure: this.config.nodemailer.secure || false,
        auth: this.config.nodemailer.auth
      })
    }

    throw new Error('Unsupported email provider or missing configuration')
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const { recipient, template, data, subject, priority = 'normal' } = options

      if (this.config.features.debug) {
        console.log(`📧 Sending email: ${template} to ${recipient.email}`)
      }

      // Render email templates
      const [htmlContent, textContent] = await Promise.all([
        this.templateService.renderTemplate(template, data, 'html'),
        this.templateService.renderTemplate(template, data, 'text').catch(() => undefined)
      ])

      // Generate subject if not provided
      const emailSubject = subject || this.generateSubject(template, data)

      // Prepare mail options
      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: this.config.from.name,
          address: this.config.from.email
        },
        to: {
          name: recipient.name || '',
          address: recipient.email
        },
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
        priority: priority as any,
        headers: {
          'X-Template': template,
          'X-User-ID': recipient.userId || '',
          'X-Mailer': 'EZShell Labs Email Service'
        }
      }

      // Send email
      const result = await this.transporter.sendMail(mailOptions)

      if (this.config.features.debug) {
        console.log(`✅ Email sent successfully: ${result.messageId}`)
      }

      return {
        success: true,
        messageId: result.messageId
      }

    } catch (error) {
      console.error('❌ Failed to send email:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendBulk(
    template: EmailTemplate,
    recipients: EmailRecipient[],
    data: any
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = []

    for (const recipient of recipients) {
      const result = await this.send({
        recipient,
        template,
        data: {
          ...data,
          userName: recipient.name || recipient.email
        }
      })
      results.push(result)

      // Add small delay to avoid overwhelming the SMTP server
      if (recipients.length > 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  async validateTemplate(template: EmailTemplate): Promise<boolean> {
    return this.templateService.validateTemplate(template)
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('✅ Email service connection verified')
      return true
    } catch (error) {
      console.error('❌ Email service connection failed:', error)
      return false
    }
  }

  private generateSubject(template: EmailTemplate, data: any): string {
    const subjectMap: Record<EmailTemplate, string> = {
      "account-validation": `Welcome to EZShell Labs - Please verify your account`,
      "password-reset": `Reset your EZShell Labs password`,
      "lab-provisioning": `Your lab "${data.labName}" is being prepared`,
      "lab-ready": `Your lab "${data.labName}" is ready!`,
      "lab-completion": `Congratulations! You completed "${data.labName}"`,
      "lab-expiration": `Your lab "${data.labName}" will expire soon`,
      "general-notification":
        data.subject || "Important notification from EZShell Labs",
      campaign: data.campaignTitle || "Special announcement from EZShell Labs",
      "instructor-assignment": `New lab assignment: "${data.labName}"`,
      "user-enrollment": `EZShell Labs - You've been enrolled in a new lab`,
    };

    return subjectMap[template] || 'Notification from EZShell Labs'
  }

  // Utility methods for testing and debugging
  async previewTemplate(template: EmailTemplate, data: any): Promise<{ html: string; text: string }> {
    return this.templateService.previewTemplate(template, data)
  }

  async listAvailableTemplates(): Promise<EmailTemplate[]> {
    return this.templateService.listAvailableTemplates()
  }

  getConfig(): EmailConfig {
    return { ...this.config }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null

export function getEmailService(config?: Partial<EmailConfig>): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService(config)
  }
  return emailServiceInstance
}

// Helper function for quick sending
export async function sendEmail(
  template: EmailTemplate,
  recipient: string | EmailRecipient,
  data: any,
  subject?: string
): Promise<EmailResult> {
  const emailService = getEmailService()

  const recipientObj: EmailRecipient = typeof recipient === 'string'
    ? { email: recipient }
    : recipient

  return emailService.send({
    recipient: recipientObj,
    template,
    data,
    subject
  })
}
