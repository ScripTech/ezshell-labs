import { z } from 'zod';

// Email configuration schema
const emailConfigSchema = z.object({
  smtp: z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().min(1).max(65535),
    secure: z.boolean(),
    auth: z.object({
      user: z.string().min(1, 'SMTP user is required'),
      pass: z.string().min(1, 'SMTP password is required'),
    }),
  }),
  from: z.object({
    name: z.string().min(1, 'From name is required'),
    email: z.string().email('Invalid from email address'),
  }),
  replyTo: z.string().email('Invalid reply-to email address').optional(),
  templatesPath: z.string().min(1, 'Templates path is required'),
  enableTracking: z.boolean().default(false),
  maxRetries: z.number().min(0).max(10).default(3),
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    maxEmails: z.number().min(1).default(100),
    windowMs: z.number().min(1000).default(3600000), // 1 hour
  }),
});

// Environment variables mapping
const getEmailConfig = () => {
  const config = {
    smtp: {
      host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'EZShell Labs',
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@ezshell-labs.com',
    },
    replyTo: process.env.EMAIL_REPLY_TO,
    templatesPath: process.env.EMAIL_TEMPLATES_PATH || '/src/services/email/templates',
    enableTracking: process.env.EMAIL_ENABLE_TRACKING === 'true',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    rateLimiting: {
      enabled: process.env.EMAIL_RATE_LIMITING_ENABLED !== 'false',
      maxEmails: parseInt(process.env.EMAIL_RATE_LIMIT_MAX || '100', 10),
      windowMs: parseInt(process.env.EMAIL_RATE_LIMIT_WINDOW || '3600000', 10),
    },
  };

  // Validate the configuration
  try {
    return emailConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Email configuration validation failed: ${issues}`);
    }
    throw error;
  }
};

// Export validated configuration
export const emailConfig = getEmailConfig();

// Type export for TypeScript
export type EmailConfig = z.infer<typeof emailConfigSchema>;

// Configuration validation helper
export const validateEmailConfig = () => {
  try {
    getEmailConfig();
    return { valid: true, error: null };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown configuration error'
    };
  }
};

// Development/testing helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Mailtrap specific configuration for testing
export const mailtrapConfig = {
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.MAILTRAP_USERNAME || '',
    pass: process.env.MAILTRAP_PASSWORD || '',
  },
};

// Email service feature flags
export const emailFeatures = {
  bulkEmail: process.env.EMAIL_BULK_ENABLED === 'true',
  templates: process.env.EMAIL_TEMPLATES_ENABLED !== 'false',
  analytics: process.env.EMAIL_ANALYTICS_ENABLED === 'true',
  scheduling: process.env.EMAIL_SCHEDULING_ENABLED === 'true',
  webhooks: process.env.EMAIL_WEBHOOKS_ENABLED === 'true',
};
