/**
 * Simple Email Service Test
 * Test the email service by making API calls
 */

// Test the email service health
async function testEmailServiceHealth() {
  try {
    console.log('🧪 Testing Email Service Health...\n');

    const healthResponse = await fetch('http://localhost:3000/api/email?action=health');
    const healthData = await healthResponse.json();

    if (healthResponse.ok) {
      console.log('✅ Email Service Health Check: PASSED');
      console.log('   Response:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Email Service Health Check: FAILED');
      console.log('   Error:', healthData);
    }
  } catch (error) {
    console.log('❌ Email Service Health Check: ERROR');
    console.log('   Error:', error.message);
  }
}

// Test getting available templates
async function testGetTemplates() {
  try {
    console.log('\n🧪 Testing Get Templates...\n');

    const templatesResponse = await fetch('http://localhost:3000/api/email?action=templates');
    const templatesData = await templatesResponse.json();

    if (templatesResponse.ok) {
      console.log('✅ Get Templates: PASSED');
      console.log('   Available Templates:');
      templatesData.templates?.forEach(template => {
        console.log(`   - ${template.type}: ${template.name}`);
      });
    } else {
      console.log('❌ Get Templates: FAILED');
      console.log('   Error:', templatesData);
    }
  } catch (error) {
    console.log('❌ Get Templates: ERROR');
    console.log('   Error:', error.message);
  }
}

// Test template preview
async function testTemplatePreview() {
  try {
    console.log('\n🧪 Testing Template Preview...\n');

    const previewResponse = await fetch('http://localhost:3000/api/email?action=preview&template=account-validation');
    const previewData = await previewResponse.json();

    if (previewResponse.ok) {
      console.log('✅ Template Preview: PASSED');
      console.log('   Preview generated for account-validation template');
    } else {
      console.log('❌ Template Preview: FAILED');
      console.log('   Error:', previewData);
    }
  } catch (error) {
    console.log('❌ Template Preview: ERROR');
    console.log('   Error:', error.message);
  }
}

// Main test function
async function runEmailServiceTests() {
  console.log('🚀 Email Service API Tests\n');
  console.log('='.repeat(50));

  await testEmailServiceHealth();
  await testGetTemplates();
  await testTemplatePreview();

  console.log('\n='.repeat(50));
  console.log('🎉 Email Service API Tests Complete!\n');
}

// Run tests if in Node.js environment
if (typeof window === 'undefined') {
  runEmailServiceTests().catch(console.error);
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.runEmailServiceTests = runEmailServiceTests;
}
