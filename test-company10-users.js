#!/usr/bin/env node

/**
 * Test that company 10 admin can see users who registered through their website
 */

const fetch = require('node-fetch');

async function testCompany10Users() {
  try {
    console.log('🧪 TESTING COMPANY 10 USERS VISIBILITY\n');
    
    // First, check what users exist for company 10
    console.log('1. Checking users in database for company 10...');
    
    // Try to login as company 10 admin (we need to check if this admin exists)
    console.log('2. Attempting to login as company 10 admin...');
    
    // Get company 10 admin email first
    const sqlite3 = require('child_process');
    const result = sqlite3.execSync('sqlite3 backend/database/thrift_shop.db "SELECT email FROM users WHERE admin_company_id = 10 LIMIT 1;"', { encoding: 'utf8' });
    
    if (!result.trim()) {
      console.log('❌ No admin found for company 10');
      console.log('   Need to create admin account for company 10 first');
      return;
    }
    
    const adminEmail = result.trim();
    console.log(`   ✅ Found admin: ${adminEmail}`);
    
    // Try to login (assuming password is admin123)
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: adminEmail, 
        password: 'admin123' 
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed - checking if we need to create admin account');
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('   ✅ Login successful');
    
    // Get users for this admin
    console.log('3. Getting users for company 10 admin...');
    const usersResponse = await fetch('http://localhost:5001/api/admin/users', {
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
    } else {
      console.log('   ℹ️  No users found - this means no users have registered through company 10 website or placed orders');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompany10Users();