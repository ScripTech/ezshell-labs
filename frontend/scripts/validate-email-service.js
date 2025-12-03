const fs = require('fs');
const path = require('path');

/**
 * Simple validation of email service files and templates
 */
function validateEmailServiceFiles() {
  console.log('🧪 Validating Email Service Files...\n');

  const baseDir = path.join(__dirname, '..');
  const templatesDir = path.join(baseDir, 'src/services/email/templates');

  // Check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    console.log('❌ Templates directory not found:', templatesDir);
    return false;
  }

  console.log('✅ Templates directory found');

  // List of expected templates
  const expectedTemplates = [
    'account-validation',
    'lab-provisioning',
    'lab-ready',
    'lab-completion',
    'lab-expiration',
    'general-notification',
    'campaign',
    'instructor-assignment'
  ];

  let allTemplatesFound = true;

  console.log('\n📧 Checking Template Files:');

  expectedTemplates.forEach(template => {
    const htmlFile = path.join(templatesDir, `${template}.html.hbs`);
    const textFile = path.join(templatesDir, `${template}.text.hbs`);

    const htmlExists = fs.existsSync(htmlFile);
    const textExists = fs.existsSync(textFile);

    console.log(`   ${template}:`);
    console.log(`     HTML: ${htmlExists ? '✅' : '❌'} ${htmlFile}`);
    console.log(`     TEXT: ${textExists ? '✅' : '❌'} ${textFile}`);

    if (!htmlExists || !textExists) {
      allTemplatesFound = false;
    }
  });

  // Check service files
  console.log('\n🔧 Checking Service Files:');

  const serviceFiles = [
    'src/services/email/EmailService.ts',
    'src/services/email/TemplateService.ts',
    'src/services/email/EmailNotificationService.ts',
    'src/services/email/types/EmailTypes.ts',
    'src/services/email/config/emailConfig.ts',
    'src/app/api/email/route.ts'
  ];

  let allServiceFilesFound = true;

  serviceFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);

    if (!exists) {
      allServiceFilesFound = false;
    }
  });

  // Check environment variables
  console.log('\n🌍 Checking Environment Variables:');

  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_AUTH_USER',
    'SMTP_AUTH_PASS',
    'EMAIL_FROM_NAME',
    'EMAIL_FROM_ADDRESS'
  ];

  let allEnvVarsSet = true;

  requiredEnvVars.forEach(envVar => {
    const isSet = process.env[envVar] !== undefined;
    console.log(`   ${isSet ? '✅' : '❌'} ${envVar}: ${isSet ? 'Set' : 'Missing'}`);

    if (!isSet) {
      allEnvVarsSet = false;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  console.log(`   Templates: ${allTemplatesFound ? '✅ All Found' : '❌ Missing Files'}`);
  console.log(`   Service Files: ${allServiceFilesFound ? '✅ All Found' : '❌ Missing Files'}`);
  console.log(`   Environment: ${allEnvVarsSet ? '✅ All Set' : '❌ Missing Variables'}`);

  const overallSuccess = allTemplatesFound && allServiceFilesFound && allEnvVarsSet;
  console.log(`   Overall: ${overallSuccess ? '✅ Ready to Use' : '❌ Needs Attention'}`);

  if (overallSuccess) {
    console.log('\n🎉 Email Service is Ready!');
    console.log('\n💡 Example usage:');
    console.log('   import { emailNotificationService } from "@/services/email/EmailNotificationService";');
    console.log('   await emailNotificationService.sendAccountValidation(user, token, url);');
  } else {
    console.log('\n⚠️ Please fix the issues above before using the email service.');
  }

  return overallSuccess;
}

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Run validation
validateEmailServiceFiles();
