require('dotenv').config();
const bcrypt = require('bcryptjs');

// Check if PostgreSQL or SQLite
const db = require('./database/db');

async function resetPassword() {
  try {
    console.log('\n🔐 Resetting password for Company ID 2 admin...\n');

    // Get company 1 info (Mery Rose)
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [1]);
    
    if (!company) {
      console.log('❌ No company found with ID 1');
      console.log('\n📋 Available companies:');
      const companies = await db.all('SELECT id, name, email FROM companies ORDER BY id');
      companies.forEach(c => {
        console.log(`   - ID ${c.id}: ${c.name} (${c.email || 'no email'})`);
      });
      process.exit(1);
    }

    console.log('✅ Company found:');
    console.log('   Name:', company.name);
    console.log('   Email:', company.email);
    console.log('   Status:', company.status);

    // Get admin user for company 1
    const admin = await db.get('SELECT * FROM users WHERE admin_company_id = ? AND role = ?', [1, 'ADMIN']);
    
    if (!admin) {
      console.log('\n❌ No admin user found for company ID 1');
      console.log('\n📋 All admins:');
      const admins = await db.all('SELECT id, email, name, admin_company_id FROM users WHERE role = ? ORDER BY id', ['ADMIN']);
      admins.forEach(a => {
        console.log(`   - ${a.email} (Company ID: ${a.admin_company_id || 'none'})`);
      });
      process.exit(1);
    }

    console.log('\n✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);

    // Set new password
    const newPassword = 'admin123'; // Simple default password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, admin.id]);

    console.log('\n✅ Password reset successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 LOGIN CREDENTIALS FOR MERY ROSE (Company ID 1):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Admin Panel URL: http://localhost:3005');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change this password after logging in!\n');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
