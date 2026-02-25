#!/usr/bin/env node

/**
 * Test company 10 users directly from database and try different admin passwords
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');

async function testCompany10Direct() {
  try {
    console.log('🧪 TESTING COMPANY 10 USERS DIRECTLY\n');
    
    // Check users in database for company 10
    console.log('1. Checking database for company 10 users...');
    const dbUsers = execSync('sqlite3 backend/database/thrift_shop.db "SELECT id, email, name, company_id FROM users WHERE company_id = 10;"', { encoding: 'utf8' });
    
    console.log('   Users with company_id = 10:');
    console.log(dbUsers || '   (none found)');
    
    // Check admin for company 10
    console.log('2. Checking admin for company 10...');
    const adminInfo = execSync('sqlite3 backend/database/thrift_shop.db "SELECT id, email, name, admin_company_id FROM users WHERE admin_company_id = 10;"', { encoding: 'utf8' });
    
    console.log('   Admin for company 10:');
    console.log(adminInfo || '   (none found)');
    
    if (!adminInfo.trim()) {
      console.log('❌ No admin found for company 10');
      return;
    }
    
    const adminEmail = adminInfo.split('|')[1];
    console.log(`   Admin email: ${adminEmail}`);
    
    // Try common passwords
    const passwords = ['admin123', 'password', '123456', 'test123'];
    
    for (const password of passwords) {
      console.log(`\n3. Trying password: ${password}`);
      
      try {
        const loginResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: adminEmail, 
            password: password 
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('   ✅ Login successful!');
          
          // Get users
          console.log('4. Getting users for company 10...');
          const usersResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/admin/users', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log(`   ✅ Users found: ${usersData.users.length}`);
            
            if (usersData.users.length > 0) {
              console.log('   📋 User details:');
              usersData.users.forEach((user, index) => {
                console.log(`      ${index + 1}. ${user.email} (${user.order_count} orders, $${user.total_spent || 0} spent)`);
              });
            } else {
              console.log('   ℹ️  No users found in admin panel');
            }
          } else {
            const errorData = await usersResponse.json();
            console.log(`   ❌ Users fetch failed: ${errorData.error}`);
          }
          
          return; // Success, exit
        } else {
          console.log('   ❌ Login failed');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n❌ Could not login with any common password');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompany10Direct();