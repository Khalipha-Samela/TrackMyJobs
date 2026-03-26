const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  console.log('🔧 Creating admin user...\n');
  
  // Default admin credentials
  const email = 'demo@trackmyjobs.com';
  const displayName = 'Demo User';
  const password = 'changeme123';
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Change if you have a MySQL password
    database: 'trackmyjobs' // or 'job_tracker'
  });
  
  try {
    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Check if admin already exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      // Update existing user
      await connection.execute(
        'UPDATE users SET password_hash = ?, display_name = ? WHERE email = ?',
        [hashedPassword, displayName, email]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin
      await connection.execute(
        'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
        [email, hashedPassword, displayName]
      );
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n=================================');
    console.log('ADMIN USER DETAILS:');
    console.log('=================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Display Name: ${displayName}`);
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createAdmin();