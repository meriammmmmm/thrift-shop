#!/usr/bin/env node

const fetch = require('node-fetch');

async function testDashboard() {
  try {
    // Login first
    console.log('1. Logging in...');
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
    
    // Get dashboard
    console.log('2. Getting dashboard data...');
    const dashboardResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    console.log('Dashboard response status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard data received');
      console.log('Company:', dashboardData.company.name);
      console.log('Products:', dashboardData.stats.totalProducts);
      console.log('Orders:', dashboardData.stats.totalOrders);
      console.log('Revenue:', dashboardData.stats.totalRevenue);
    } else {
      const errorData = await dashboardResponse.json();
      console.log('❌ Dashboard error:', errorData);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDashboard();