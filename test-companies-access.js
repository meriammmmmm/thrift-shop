#!/usr/bin/env node

/**
 * Test that company admins cannot access /api/companies endpoint
 */

const fetch = require('node-fetch');

async function testCompaniesAccess() {
  try {
    console.log('🔒 TESTING COMPANIES ENDPOINT ACCESS RESTRICTION\n');
    
    // Login as company admin
    console.log('1. Logging in as Vintage Treasures admin...');
    const loginResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@vintagetreasures.com', 
        password: 'admin123' 
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Try to access companies endpoint
    console.log('2. Trying to access /api/companies...');
    const companiesResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/companies', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    console.log(`Response status: ${companiesResponse.status}`);
    
    if (companiesResponse.status === 403) {
      const errorData = await companiesResponse.json();
      console.log('✅ ACCESS DENIED (as expected)');
      console.log(`   Error: ${errorData.error}`);
      console.log('');
      console.log('🎯 RESULT: Company admins CANNOT see other companies ✅');
    } else if (companiesResponse.status === 200) {
      console.log('❌ ACCESS GRANTED (this should not happen!)');
      const data = await companiesResponse.json();
      console.log(`   Companies visible: ${data.companies?.length || 0}`);
      console.log('');
      console.log('🚨 SECURITY ISSUE: Company admins can see other companies!');
    } else {
      console.log(`❓ Unexpected response: ${companiesResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompaniesAccess();