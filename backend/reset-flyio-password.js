require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function resetPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('\n🔐 Resetting password on Fly.io PostgreSQL database...\n');

    // Get all companies
    const companiesResult = await pool.query('SELECT * FROM companies ORDER BY id');
    console.log('📋 Available companies:');
    companiesResult.rows.forEach(c => {
      console.log(`   - ID ${c.id}: ${c.name} (${c.email || 'no email'})`);
    });

    // Get company 1 (Mery Rose)
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [1]);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ No company found with ID 1');
      await pool.end();
      process.exit(1);
    }

    const company = companyResult.rows[0];
    console.log('\n✅ Company found:');
    console.log('   Name:', company.name);
    console.log('   Email:', company.email);
    console.log('   Status:', company.status);

    // Get admin user for company 1
    const adminResult = await pool.query(
      'SELECT * FROM users WHERE admin_company_id = $1 AND role = $2', 
      [1, 'ADMIN']
    );
    
    if (adminResult.rows.length === 0) {
      console.log('\n❌ No admin user found for company ID 1');
      
      // Show all admins
      const allAdmins = await pool.query('SELECT id, email, name, admin_company_id FROM users WHERE role = $1 ORDER BY id', ['ADMIN']);
      console.log('\n📋 All admins:');
      allAdmins.rows.forEach(a => {
        console.log(`   - ${a.email} (Company ID: ${a.admin_company_id || 'none'})`);
      });
      
      await pool.end();
      process.exit(1);
    }

    const admin = adminResult.rows[0];
    console.log('\n✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);

    // Set new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, admin.id]);

    console.log('\n✅ Password reset successfully on Fly.io database!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 LOGIN CREDENTIALS FOR MERY ROSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Admin Panel URL: http://localhost:3005');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change this password after logging in!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();
