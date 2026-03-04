// Quick script to fix inventory via API
const http = require('http');

// You need to replace this with a valid admin token
// Get it from localStorage in your browser or create a new admin login
const ADMIN_TOKEN = process.argv[2];

if (!ADMIN_TOKEN) {
  console.log('\n❌ Please provide an admin token:');
  console.log('node fix-inventory-now.js YOUR_ADMIN_TOKEN\n');
  console.log('Or run this in your browser console while logged in as admin:');
  console.log('localStorage.getItem("auth-token")\n');
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/fix-inventory',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔧 Fixing inventory...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('✅ Success!');
        console.log(`\n${result.message}\n`);
        
        if (result.details.productsFixed.length > 0) {
          console.log('Fixed products:');
          result.details.productsFixed.forEach(p => {
            console.log(`  - Product #${p.productId}: ${p.productName} (Order #${p.orderId}) - ${p.reason}`);
          });
        } else {
          console.log('No products needed fixing - inventory is already correct!');
        }
      } else {
        console.log('❌ Error:', result.error || result.message);
      }
    } catch (e) {
      console.log('❌ Error parsing response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
