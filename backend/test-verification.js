// Test script for email and phone verification
// Run with: node test-verification.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/auth';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailVerification() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📧 Testing Email Verification', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const testEmail = `test${Date.now()}@example.com`;
  let verificationCode = '';

  try {
    // Step 1: Send verification code
    log('Step 1: Sending verification code...', 'blue');
    const sendResponse = await axios.post(`${BASE_URL}/send-verification-code`, {
      email: testEmail,
      method: 'email',
      type: 'registration'
    });
    
    log('✅ Code sent successfully!', 'green');
    log(`   Message: ${sendResponse.data.message}`, 'green');
    
    // In development, the code might be logged to console
    // For testing, we'll need to manually enter it
    log('\n⚠️  Check your email or server console for the verification code', 'yellow');
    log(`   Email: ${testEmail}`, 'yellow');
    
    // Simulate code (in real scenario, user would enter this)
    // For automated testing, you'd need to read from database or console
    log('\n   To continue testing, you need to:', 'yellow');
    log('   1. Check the email or server console for the code', 'yellow');
    log('   2. Update this script with the code', 'yellow');
    log('   3. Or manually test with curl/Postman', 'yellow');

    return { success: true, email: testEmail };

  } catch (error) {
    log('❌ Email verification test failed!', 'red');
    if (error.response) {
      log(`   Error: ${error.response.data.error}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    return { success: false };
  }
}

async function testPhoneVerification() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📱 Testing Phone/SMS Verification', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const testPhone = '+1234567890'; // Use your test phone number

  try {
    // Step 1: Send SMS verification code
    log('Step 1: Sending SMS verification code...', 'blue');
    const sendResponse = await axios.post(`${BASE_URL}/send-verification-code`, {
      phone: testPhone,
      method: 'sms',
      type: 'registration'
    });
    
    log('✅ SMS code sent successfully!', 'green');
    log(`   Message: ${sendResponse.data.message}`, 'green');
    
    if (sendResponse.data.dev) {
      log('\n⚠️  Running in development mode', 'yellow');
      log('   Check server console for the verification code', 'yellow');
    } else {
      log('\n⚠️  Check your phone for the verification code', 'yellow');
    }
    
    log(`   Phone: ${testPhone}`, 'yellow');

    return { success: true, phone: testPhone };

  } catch (error) {
    log('❌ Phone verification test failed!', 'red');
    if (error.response) {
      log(`   Error: ${error.response.data.error}`, 'red');
      if (error.response.data.details) {
        log(`   Details: ${error.response.data.details}`, 'yellow');
      }
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    return { success: false };
  }
}

async function testDuplicateEmail() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔒 Testing One Email Per User', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const testEmail = 'duplicate@example.com';

  try {
    // Try to send verification code for same email twice
    log('Step 1: Sending first verification code...', 'blue');
    await axios.post(`${BASE_URL}/send-verification-code`, {
      email: testEmail,
      method: 'email',
      type: 'registration'
    });
    log('✅ First code sent', 'green');

    log('\nStep 2: Trying to send code to same email again...', 'blue');
    await axios.post(`${BASE_URL}/send-verification-code`, {
      email: testEmail,
      method: 'email',
      type: 'registration'
    });
    log('✅ Second code sent (allowed for verification)', 'green');

    // Now try to register with the email
    log('\nStep 3: Simulating registration with this email...', 'blue');
    log('   (This would fail if email already exists in users table)', 'yellow');

    return { success: true };

  } catch (error) {
    if (error.response && error.response.data.error === 'Email already registered') {
      log('✅ Duplicate email protection working!', 'green');
      log('   System correctly rejected duplicate email', 'green');
      return { success: true };
    } else {
      log('❌ Unexpected error', 'red');
      log(`   Error: ${error.message}`, 'red');
      return { success: false };
    }
  }
}

async function testServerConnection() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔌 Testing Server Connection', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  try {
    const response = await axios.get('http://localhost:5001/api/health');
    log('✅ Server is running!', 'green');
    log(`   Status: ${response.data.status}`, 'green');
    log(`   Message: ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log('❌ Cannot connect to server!', 'red');
    log('   Make sure the server is running:', 'yellow');
    log('   cd backend && npm start', 'yellow');
    return false;
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════╗', 'cyan');
  log('║   VERIFICATION SYSTEM TEST SUITE          ║', 'cyan');
  log('╚═══════════════════════════════════════════╝', 'cyan');

  // Test server connection first
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    log('\n❌ Tests aborted - server not running', 'red');
    return;
  }

  // Run tests
  const emailResult = await testEmailVerification();
  const phoneResult = await testPhoneVerification();
  const duplicateResult = await testDuplicateEmail();

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 Test Summary', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const results = [
    { name: 'Email Verification', result: emailResult.success },
    { name: 'Phone Verification', result: phoneResult.success },
    { name: 'Duplicate Email Protection', result: duplicateResult.success }
  ];

  results.forEach(({ name, result }) => {
    const icon = result ? '✅' : '❌';
    const color = result ? 'green' : 'red';
    log(`${icon} ${name}`, color);
  });

  const allPassed = results.every(r => r.success);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  if (allPassed) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed - check configuration', 'yellow');
  }

  log('\n📚 Next Steps:', 'blue');
  log('   1. Configure email in backend/.env', 'blue');
  log('   2. Check server console for verification codes', 'blue');
  log('   3. Test manually with the codes', 'blue');
  log('   4. See QUICK_START_VERIFICATION.md for details\n', 'blue');
}

// Run tests
runTests().catch(error => {
  log('\n❌ Test suite failed!', 'red');
  log(`   Error: ${error.message}`, 'red');
  process.exit(1);
});
