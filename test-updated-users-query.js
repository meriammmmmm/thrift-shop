#!/usr/bin/env node

/**
 * Test the updated users query with a known working admin
 */

const fetch = require('node-fetch');

async function testUpdatedUsersQuery() {
  try {
    console.log('🧪 TESTING UPDATED USERS QUERY\n');
    
    // Test with Vintage Treasures admin (known to work)
    console.log('1. Testing with Vintage Treasures admin...');
    const loginResponse = await fetch('https://mery-rose-backend.onrender.comapi/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@vintagetreasures.com', 
        password: 'admin123' 
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   ✅ Login successful');
    
    // Get users
    console.log('2. Getting users with updated query...');
    const usersResponse = await fetch('https://mery-rose-backend.onrender.comapi/admin/users', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!usersResponse.ok) {
      const errorData = await usersResponse.json();
      console.log(`❌ Users fetch failed: ${errorData.error}`);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log(`   ✅ Users found: ${usersData.users.length}`);
    
    if (usersData.users.length > 0) {
      console.log('   📋 User details:');
      usersData.users.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.email} (${user.order_count} orders, $${user.total_spent || 0} spent)`);
      });
    }
    
    // Now check what users exist in database for company 1
    console.log('\n3. Checking database for company 1 users...');
    const { execSync } = require('child_process');
    const dbUsers = execSync('sqlite3 backend/database/thrift_shop.db "SELECT email, company_id FROM users WHERE company_id = 1 OR id IN (SELECT DISTINCT user_id FROM orders WHERE company_id = 1);"', { encoding: 'utf8' });
    
    console.log('   Database users for company 1:');
    console.log(dbUsers || '   (none found)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpdatedUsersQuery();