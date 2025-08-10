# Email Notification Service

A comprehensive email notification system for EZShell Labs built with TypeScript, Nodemailer, and Handlebars templates.

## 🚀 Features

- **Template Engine**: Handlebars-based email templates with HTML and text versions
- **Multiple Templates**: Pre-built templates for various notification types
- **Type Safety**: Full TypeScript support with interface definitions
- **Bulk Email**: Support for sending emails to multiple recipients
- **Configuration Management**: Environment-based configuration with validation
- **Error Handling**: Robust error handling and logging
- **Rate Limiting**: Built-in rate limiting capabilities
- **Testing**: Mailtrap integration for development testing

## 📧 Available Templates

### 1. Account Validation
- **Purpose**: Email verification and account activation
- **Template**: `account-validation`
- **Data**: User details, verification token, verification URL

### 2. Lab Provisioning
- **Purpose**: Lab environment setup in progress
- **Template**: `lab-provisioning`
- **Data**: Lab name, description, estimated time, provisioning steps

### 3. Lab Ready
- **Purpose**: Lab environment is ready to use
- **Template**: `lab-ready`
- **Data**: Lab details, access URL, duration, expiration time

### 4. Lab Completion
- **Purpose**: Lab completed with results and certificate
- **Template**: `lab-completion`
- **Data**: Results, score, achievements, certificate download, feedback

### 5. Lab Expiration
- **Purpose**: Lab session expiring soon warning
- **Template**: `lab-expiration`
- **Data**: Lab name, expiration time, extension options

### 6. General Notification
- **Purpose**: Generic notification template
- **Template**: `general-notification`
- **Data**: Custom message, priority, action buttons, attachments

### 7. Campaign
- **Purpose**: Marketing and promotional emails
- **Template**: `campaign`
- **Data**: Campaign content, CTAs, features, testimonials

### 8. Instructor Assignment
- **Purpose**: New student assignment for instructors
- **Template**: `instructor-assignment`
- **Data**: Assignment details, student list, responsibilities

## 🔧 Setup

### 1. Environment Configuration

Create a `.env.local` file in your frontend directory:

```bash
# SMTP Configuration (Mailtrap for development)
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password

# Email From Configuration
EMAIL_FROM_NAME="EZShell Labs"
EMAIL_FROM_ADDRESS=noreply@ezshell-labs.com
EMAIL_REPLY_TO=support@ezshell-labs.com

# Template Configuration
EMAIL_TEMPLATES_PATH=/src/services/email/templates

# Email Service Features
EMAIL_ENABLE_TRACKING=false
EMAIL_MAX_RETRIES=3
EMAIL_RATE_LIMITING_ENABLED=true
EMAIL_RATE_LIMIT_MAX=100
EMAIL_RATE_LIMIT_WINDOW=3600000

# Feature Flags
EMAIL_BULK_ENABLED=true
EMAIL_TEMPLATES_ENABLED=true
EMAIL_ANALYTICS_ENABLED=false
EMAIL_SCHEDULING_ENABLED=true
EMAIL_WEBHOOKS_ENABLED=false
```

### 2. Install Dependencies

The following dependencies are required (likely already installed):

```bash
npm install nodemailer handlebars zod
npm install @types/nodemailer --save-dev
```

### 3. Test the Service

Run the test script to verify your setup:

```bash
node scripts/test-email-service.js
```

## 📖 Usage

### Using the EmailNotificationService (Recommended)

```typescript
import { emailNotificationService } from '@/services/email/EmailNotificationService';

// Send account validation email
await emailNotificationService.sendAccountValidation(user, token, verificationUrl);

// Send lab ready notification
await emailNotificationService.sendLabReady(user, {
  name: 'AWS EC2 Fundamentals',
  description: 'Learn EC2 basics',
  accessUrl: 'https://lab.ezshell-labs.com/access/123',
  duration: '2 hours',
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
});

// Send general notification
await emailNotificationService.sendGeneralNotification(user, {
  subject: 'Platform Update',
  message: 'We have new features available!',
  priority: 'medium',
  actionButton: {
    text: 'View Updates',
    url: 'https://app.ezshell-labs.com/updates'
  }
});
```

### Using the EmailService Directly

```typescript
import { EmailService } from '@/services/email/EmailService';

const emailService = new EmailService();

// Send single email
await emailService.send({
  template: 'account-validation',
  recipient: { email: 'user@example.com', name: 'John Doe' },
  data: {
    userName: 'John Doe',
    verificationUrl: 'https://app.ezshell-labs.com/verify?token=123',
    verificationToken: 'VER-123-456',
    companyName: 'EZShell Labs',
    supportEmail: 'support@ezshell-labs.com',
    currentYear: '2024'
  },
  subject: 'Verify Your Account',
  priority: 'high'
});

// Send bulk email
await emailService.sendBulk(
  'general-notification',
  [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  templateData
);
```

### Using the API Endpoints

#### Send Email via API

```typescript
const response = await fetch('/api/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateType: 'lab-ready',
    recipients: [{ email: 'user@example.com', name: 'John Doe' }],
    templateData: {
      userName: 'John Doe',
      labName: 'AWS EC2 Fundamentals',
      accessUrl: 'https://lab.example.com/access/123',
      duration: '2 hours'
    },
    subject: 'Your Lab is Ready!',
    priority: 'high'
  })
});
```

#### Get Available Templates

```typescript
const response = await fetch('/api/email?action=templates');
const { templates } = await response.json();
```

#### Preview Template

```typescript
const response = await fetch('/api/email?action=preview&template=lab-ready');
const { preview } = await response.json();
```

## 🎨 Template Development

### Template Structure

Each template has two versions:
- **HTML**: `{template-name}.html.hbs` - Rich HTML version
- **Text**: `{template-name}.text.hbs` - Plain text fallback

### Handlebars Helpers

The following custom helpers are available in templates:

- `{{formatDate date}}` - Format dates
- `{{formatTime date}}` - Format times
- `{{substring string start end}}` - String manipulation
- `{{eq value1 value2}}` - Equality comparison
- `{{gt value1 value2}}` - Greater than comparison

### Adding New Templates

1. Create HTML and text template files in `/src/services/email/templates/`
2. Add the template type to the `EmailTemplate` union in `types/EmailTypes.ts`
3. Add template data interface if needed
4. Update the template list in the API route

## 🔒 Security

- **Input Validation**: All email data is validated using Zod schemas
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Authentication**: API endpoints require authentication
- **XSS Protection**: Templates are properly escaped
- **SMTP Security**: Secure SMTP configuration with authentication

## 🐛 Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify SMTP credentials in `.env.local`
   - Check if Mailtrap account is active
   - Ensure correct host and port settings

2. **Template Not Found**
   - Verify template files exist in `/src/services/email/templates/`
   - Check template name spelling
   - Ensure both HTML and text versions exist

3. **Email Not Sending**
   - Check server logs for detailed error messages
   - Verify recipient email addresses are valid
   - Check rate limiting settings

4. **Template Rendering Errors**
   - Validate template data matches expected interface
   - Check for missing required template variables
   - Verify Handlebars syntax in templates

### Debug Mode

Enable debug mode by setting:

```bash
EMAIL_DEBUG_MODE=true
```

This will provide detailed logging of email operations.

## 📊 Monitoring

### Health Check

Check service health via API:

```bash
curl /api/email?action=health
```

### Testing

Test email sending without actually sending:

```bash
# Use Mailtrap for testing
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
```

## 🚀 Production Deployment

### Environment Setup

For production, update your environment variables:

```bash
# Production SMTP (example with SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# Production email settings
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
EMAIL_ENABLE_TRACKING=true
```

### Scaling Considerations

- **Rate Limiting**: Adjust rate limits based on your email provider
- **Queue System**: Consider implementing a job queue for high-volume scenarios
- **Monitoring**: Set up monitoring for email delivery rates and failures
- **Templates**: Optimize template loading and caching

## 🤝 Contributing

When adding new email templates or features:

1. Follow the existing template structure
2. Add proper TypeScript interfaces
3. Include both HTML and text versions
4. Test with sample data
5. Update this documentation

## 📝 License

This email service is part of the EZShell Labs platform and follows the project's licensing terms.
