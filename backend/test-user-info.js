// Simple test script for user information endpoints
const axios = require('axios');

const API_BASE = 'https://mery-rose-backend.onrender.com';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

const testUserInfo = {
  fullName: 'Jean Dupont',
  email: 'jean.dupont@example.com',
  phone: '+216 12 345 678',
  optionalPhone: '+216 98 765 432',
  address: '123 Rue de la Liberté',
  city: 'Tunis',
  state: 'Tunis',
  zipCode: '1000',
  country: 'Tunisia'
};

let authToken = '';

async function testUserInfoAPI() {
  try {
    console.log('🧪 Testing User Information API...\n');

    // 1. Register or login user
    console.log('1. Registering test user...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ User registered successfully');
      authToken = registerResponse.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.token;
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Try to get user info (should not exist initially)
    console.log('\n2. Getting user info (should not exist)...');
    try {
      await axios.get(`${API_BASE}/users/info`, { headers });
      console.log('⚠️  User info already exists');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ User info not found (as expected)');
      } else {
        throw error;
      }
    }

    // 3. Create user info
    console.log('\n3. Creating user info...');
    const createResponse = await axios.post(`${API_BASE}/users/info`, testUserInfo, { headers });
    console.log('✅ User info created successfully');
    console.log('📄 Created info:', JSON.stringify(createResponse.data.userInfo, null, 2));

    // 4. Get user info
    console.log('\n4. Getting user info...');
    const getResponse = await axios.get(`${API_BASE}/users/info`, { headers });
    console.log('✅ User info retrieved successfully');
    console.log('📄 Retrieved info:', JSON.stringify(getResponse.data.userInfo, null, 2));

    // 5. Update user info
    console.log('\n5. Updating user info...');
    const updatedInfo = {
      ...testUserInfo,
      fullName: 'Jean Dupont Updated',
      city: 'Sfax',
      state: 'Sfax'
    };
    const updateResponse = await axios.put(`${API_BASE}/users/info`, updatedInfo, { headers });
    console.log('✅ User info updated successfully');
    console.log('📄 Updated info:', JSON.stringify(updateResponse.data.userInfo, null, 2));

    // 6. Get updated user info
    console.log('\n6. Getting updated user info...');
    const getUpdatedResponse = await axios.get(`${API_BASE}/users/info`, { headers });
    console.log('✅ Updated user info retrieved successfully');
    console.log('📄 Final info:', JSON.stringify(getUpdatedResponse.data.userInfo, null, 2));

    // 7. Test validation (invalid email)
    console.log('\n7. Testing validation with invalid email...');
    try {
      await axios.put(`${API_BASE}/users/info`, {
        ...testUserInfo,
        email: 'invalid-email'
      }, { headers });
      console.log('❌ Validation should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation working correctly:', error.response.data.error);
      } else {
        throw error;
      }
    }

    // 8. Test validation (missing required field)
    console.log('\n8. Testing validation with missing required field...');
    try {
      await axios.put(`${API_BASE}/users/info`, {
        ...testUserInfo,
        fullName: ''
      }, { headers });
      console.log('❌ Validation should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation working correctly:', error.response.data.error);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testUserInfoAPI();