#!/usr/bin/env node

const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@vintagetreasures.com', 
        password: 'admin123' 
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();