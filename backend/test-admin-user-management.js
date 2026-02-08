// Test script for admin user management functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@thriftshop.com',
  password: 'admin123'
};

let adminToken = '';

async function testAdminUserManagement() {
  try {
    console.log('🧪 Testing Admin User Management...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    adminToken = loginResponse.data.token;
    console.log('✅ Admin logged in successfully');

    // 2. Test creating a user
    console.log('\n2. Testing user creation...');
    const newUserData = {
      email: 'testuser@example.com',
      password: 'testpass123',
      name: 'Test User',
      role: 'USER',
      userInfo: {
        fullName: 'Test User Full Name',
        email: 'testuser@example.com',
        phone: '+216 12 345 678',
        optionalPhone: '+216 98 765 432',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Tunisia'
      }
    };

    try {
      const createResponse = await axios.post(`${API_BASE}/admin/users`, newUserData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ User created successfully:', createResponse.data.user.email);
      var createdUserId = createResponse.data.user.id;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing with tests...');
        // Get existing user ID
        const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const existingUser = usersResponse.data.users.find(u => u.email === newUserData.email);
        createdUserId = existingUser.id;
      } else {
        throw error;
      }
    }

    // 3. Test getting all users
    console.log('\n3. Testing get all users...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved users:', usersResponse.data.users.length);

    // 4. Test getting single user details
    console.log('\n4. Testing get user details...');
    const userDetailsResponse = await axios.get(`${API_BASE}/admin/users/${createdUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved user details for:', userDetailsResponse.data.user.email);
    console.log('📋 User info available:', !!userDetailsResponse.data.userInfo);
    console.log('📊 User stats:', userDetailsResponse.data.stats);

    // 5. Test updating user
    console.log('\n5. Testing user update...');
    const updateData = {
      name: 'Updated Test User',
      userInfo: {
        fullName: 'Updated Full Name',
        phone: '+216 11 111 111',
        city: 'Updated City'
      }
    };
    const updateResponse = await axios.put(`${API_BASE}/admin/users/${createdUserId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ User updated successfully:', updateResponse.data.user.name);

    // 6. Verify update
    console.log('\n6. Verifying update...');
    const updatedUserResponse = await axios.get(`${API_BASE}/admin/users/${createdUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Update verified:', updatedUserResponse.data.user.name);
    console.log('📋 Updated user info:', updatedUserResponse.data.userInfo?.full_name);

    // 7. Test deleting user (only if it's not an admin)
    if (updatedUserResponse.data.user.role !== 'ADMIN') {
      console.log('\n7. Testing user deletion...');
      const deleteResponse = await axios.delete(`${API_BASE}/admin/users/${createdUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ User deleted successfully:', deleteResponse.data.deletedUser.email);
    } else {
      console.log('\n7. Skipping deletion test (user is admin)');
    }

    console.log('\n🎉 All admin user management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAdminUserManagement();