// Test script for enhanced registration with user information
const axios = require('axios');

const API_BASE = 'https://thrift-shop-production.up.railway.app/api';

// Test data for enhanced registration
const testRegistrationData = {
  email: 'enhanced-test@example.com',
  password: 'password123',
  name: 'Enhanced Test User',
  userInfo: {
    fullName: 'Ahmed Ben Ali',
    email: 'enhanced-test@example.com',
    phone: '+216 12 345 678',
    optionalPhone: '+216 98 765 432',
    address: '456 Avenue Habib Bourguiba',
    city: 'Sfax',
    state: 'Sfax',
    zipCode: '3000',
    country: 'Tunisia'
  }
};

async function testEnhancedRegistration() {
  try {
    console.log('🧪 Testing Enhanced Registration with User Information...\n');

    // 1. Clean up - delete user if exists
    console.log('1. Cleaning up existing test user...');
    try {
      // Try to login first to get token
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testRegistrationData.email,
        password: testRegistrationData.password
      });
      console.log('ℹ️  Test user exists, will test with existing user');
    } catch (error) {
      console.log('✅ No existing test user found, proceeding with registration');
    }

    // 2. Test enhanced registration
    console.log('\n2. Testing enhanced registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testRegistrationData);
      console.log('✅ Enhanced registration successful!');
      console.log('📋 User data:', {
        id: registerResponse.data.user.id,
        email: registerResponse.data.user.email,
        name: registerResponse.data.user.name
      });

      const authToken = registerResponse.data.token;

      // 3. Verify user info was saved
      console.log('\n3. Verifying user information was saved...');
      const userInfoResponse = await axios.get(`${API_BASE}/users/info`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (userInfoResponse.data.success && userInfoResponse.data.userInfo) {
        console.log('✅ User information saved successfully!');
        console.log('📋 Saved user info:', userInfoResponse.data.userInfo);
        
        // Verify all fields match
        const savedInfo = userInfoResponse.data.userInfo;
        const originalInfo = testRegistrationData.userInfo;
        
        const fieldsToCheck = [
          { saved: 'full_name', original: 'fullName' },
          { saved: 'email', original: 'email' },
          { saved: 'phone', original: 'phone' },
          { saved: 'optional_phone', original: 'optionalPhone' },
          { saved: 'address', original: 'address' },
          { saved: 'city', original: 'city' },
          { saved: 'state', original: 'state' },
          { saved: 'zip_code', original: 'zipCode' },
          { saved: 'country', original: 'country' }
        ];

        let allFieldsMatch = true;
        for (const field of fieldsToCheck) {
          if (savedInfo[field.saved] !== originalInfo[field.original]) {
            console.log(`❌ Field mismatch: ${field.saved} = "${savedInfo[field.saved]}", expected "${originalInfo[field.original]}"`);
            allFieldsMatch = false;
          }
        }

        if (allFieldsMatch) {
          console.log('✅ All user information fields match perfectly!');
        }
      } else {
        console.log('❌ User information was not saved properly');
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists from previous test');
        
        // Login and check if user info exists
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: testRegistrationData.email,
          password: testRegistrationData.password
        });
        
        const authToken = loginResponse.data.token;
        const userInfoResponse = await axios.get(`${API_BASE}/users/info`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (userInfoResponse.data.success && userInfoResponse.data.userInfo) {
          console.log('✅ User information exists from previous registration');
          console.log('📋 Existing user info:', userInfoResponse.data.userInfo);
        }
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Enhanced registration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedRegistration();