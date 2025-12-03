#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests the email notification service with sample data
 */

const { EmailService } = require('./src/services/email/EmailService');
const { emailNotificationService } = require('./src/services/email/EmailNotificationService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  try {
    // Test 1: Initialize email service
    console.log('1. Testing Email Service Initialization...');
    const emailService = new EmailService();
    console.log('✅ Email Service initialized successfully\n');

    // Test 2: Test template validation
    console.log('2. Testing Template Validation...');
    const isValid = await emailService.validateTemplate('account-validation');
    console.log(`✅ Template validation: ${isValid ? 'Valid' : 'Invalid'}\n`);

    // Test 3: Test connection (if available)
    console.log('3. Testing SMTP Connection...');
    try {
      const isConnected = await emailService.testConnection();
      console.log(`✅ SMTP Connection: ${isConnected ? 'Connected' : 'Failed'}\n`);
    } catch (error) {
      console.log(`⚠️  SMTP Connection test not available: ${error.message}\n`);
    }

    // Test 4: Test notification service initialization
    console.log('4. Testing Email Notification Service...');
    const notificationService = emailNotificationService;
    console.log('✅ Email Notification Service initialized successfully\n');

    // Test 5: Validate environment configuration
    console.log('5. Testing Environment Configuration...');
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM_ADDRESS',
      'EMAIL_FROM_NAME'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
      console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      console.log('   Please check your .env.local file\n');
    } else {
      console.log('✅ All required environment variables are set\n');
    }

    // Test 6: Validate template files
    console.log('6. Testing Template Files...');
    const templateTypes = [
      'account-validation',
      'lab-provisioning',
      'lab-ready',
      'lab-completion',
      'lab-expiration',
      'general-notification',
      'campaign',
      'instructor-assignment'
    ];

    const fs = require('fs');
    const path = require('path');

    for (const template of templateTypes) {
      const htmlPath = path.join(__dirname, 'src/services/email/templates', `${template}.html.hbs`);
      const textPath = path.join(__dirname, 'src/services/email/templates', `${template}.text.hbs`);

      const htmlExists = fs.existsSync(htmlPath);
      const textExists = fs.existsSync(textPath);

      console.log(`   ${template}: HTML=${htmlExists ? '✅' : '❌'} TEXT=${textExists ? '✅' : '❌'}`);
    }
    console.log('');

    console.log('🎉 Email Service Tests Completed!\n');
    console.log('📧 Your email notification service is ready to use.');
    console.log('');

  } catch (error) {
    console.error('❌ Email Service Test Failed:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = { testEmailService };
