const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'backend', 'database', 'thrift_shop.db');
const db = new sqlite3.Database(dbPath);

console.log('=== ADMIN ACCOUNTS AND THEIR USERS ===\n');

// Get all admin accounts with their companies
db.all(`
  SELECT 
    u.id as admin_id,
    u.email as admin_email,
    u.name as admin_name,
    u.admin_company_id,
    c.name as company_name
  FROM users u
  LEFT JOIN companies c ON u.admin_company_id = c.id
  WHERE u.role = 'ADMIN' AND u.admin_company_id IS NOT NULL
  ORDER BY u.admin_company_id
`, (err, admins) => {
  if (err) {
    console.error('Error fetching admins:', err);
    return;
  }

  admins.forEach(admin => {
    console.log(`\n📊 ADMIN: ${admin.admin_name} (${admin.admin_email})`);
    console.log(`🏢 COMPANY: ${admin.company_name} (ID: ${admin.admin_company_id})`);
    console.log('─'.repeat(60));

    // Get users for this company
    db.all(`
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as order_count,
        SUM(CASE WHEN o.company_id = ? THEN o.total ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.company_id = ? AND o.status != 'CANCELLED'
      WHERE u.role != 'ADMIN' 
        AND (u.company_id = ? OR EXISTS (
          SELECT 1 FROM orders o2 WHERE o2.user_id = u.id AND o2.company_id = ?
        ))
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, [admin.admin_company_id, admin.admin_company_id, admin.admin_company_id, admin.admin_company_id], (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return;
      }

      if (users.length === 0) {
        console.log('❌ No users found for this company');
      } else {
        console.log(`✅ Found ${users.length} user(s):`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email})`);
          console.log(`      Orders: ${user.order_count || 0}, Spent: $${(user.total_spent || 0).toFixed(2)}`);
        });
      }
      
      // Check if this is the last admin
      if (admin.admin_id === admins[admins.length - 1].admin_id) {
        console.log('\n' + '='.repeat(60));
        console.log('💡 TIP: Login with an admin account that has users to see them in the admin panel!');
        console.log('📝 Available test credentials:');
        console.log('   • admin@vintagetreasures.com / admin123');
        console.log('   • admin@ecofashionhub.com / admin123');
        console.log('   • admin@retrostyleco.com / admin123');
        db.close();
      }
    });
  });
});