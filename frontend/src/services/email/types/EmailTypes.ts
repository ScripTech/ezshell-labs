export type EmailTemplate =
  | 'account-validation'
  | 'password-reset'
  | 'lab-provisioning'
  | 'lab-ready'
  | 'lab-completion'
  | 'lab-expiration'
  | 'general-notification'
  | 'campaign'
  | 'instructor-assignment'
  | 'user-enrollment'

export interface EmailRecipient {
  email: string
  name?: string
  userId?: string
}

export interface EmailOptions {
  recipient: EmailRecipient
  template: EmailTemplate
  data: any
  subject?: string
  priority?: 'low' | 'normal' | 'high'
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Template Data Interfaces
export interface AccountValidationData {
  userName: string
  verificationToken: string
  verificationUrl: string
  expiresIn: string
}

export interface PasswordResetData {
  userName: string
  resetToken: string
  resetUrl: string
  expiresIn: string
}

export interface LabProvisioningData {
  userName: string
  labName: string
  labDescription?: string
  estimatedTime: string
  statusUrl?: string
}

export interface LabReadyData {
  userName: string
  labName: string
  labDescription?: string
  accessUrl: string
  duration: string
  expiresAt?: string
}

export interface LabCompletionData {
  userName: string
  labName: string
  completionTime: string
  score?: number
  certificateUrl?: string
  nextRecommendations?: string[]
}

export interface LabExpirationData {
  userName: string
  labName: string
  expiresAt: string
  extendUrl?: string
}

export interface GeneralNotificationData {
  userName: string
  subject: string
  message: string
  actionUrl?: string
  actionText?: string
}

export interface CampaignData {
  userName: string
  campaignTitle: string
  campaignMessage: string
  ctaUrl: string
  ctaText: string
  unsubscribeUrl: string
}

export interface InstructorAssignmentData {
  instructorName: string
  labName: string
  assignmentDetails: string
  dueDate?: string
  labUrl: string
}

export interface EmailConfig {
  provider: 'nodemailer' | 'sendgrid' | 'ses'
  from: {
    email: string
    name: string
  }
  nodemailer?: {
    host: string
    port: number
    secure?: boolean
    auth: {
      user: string
      pass: string
    }
  }
  sendgrid?: {
    apiKey: string
  }
  ses?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
  templates: {
    engine: 'handlebars' | 'ejs'
    baseUrl?: string
  }
  features: {
    queue: boolean
    tracking: boolean
    debug: boolean
  }
}

export interface EmailServiceInterface {
  send(options: EmailOptions): Promise<EmailResult>
  sendBulk(template: EmailTemplate, recipients: EmailRecipient[], data: any): Promise<EmailResult[]>
  validateTemplate(template: EmailTemplate): Promise<boolean>
  testConnection(): Promise<boolean>
}
