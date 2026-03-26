const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('🔧 Setting up TrackMyJobs Database\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });
  
  try {
    // Drop existing database if exists
    console.log('📝 Dropping existing database...');
    await connection.execute('DROP DATABASE IF EXISTS trackmyjobs');
    console.log('✅ Dropped old database');
    
    // Create fresh database
    console.log('\n📝 Creating trackmyjobs database...');
    await connection.execute('CREATE DATABASE trackmyjobs');
    await connection.execute('USE trackmyjobs');
    console.log('✅ Database created');
    
    // Create users table
    console.log('\n📝 Creating users table...');
    await connection.execute(`
      CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create applications table with company_name
    console.log('\n📝 Creating applications table...');
    await connection.execute(`
      CREATE TABLE applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          job_title VARCHAR(255) NOT NULL,
          job_link VARCHAR(500),
          application_date DATE NOT NULL,
          status ENUM('Applied', 'Interview', 'Rejected', 'Offer') DEFAULT 'Applied',
          notes TEXT,
          cv_filename VARCHAR(255),
          cv_original_name VARCHAR(255),
          cv_mime_type VARCHAR(100),
          cv_size INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_application_date (application_date),
          INDEX idx_status (status)
      )
    `);
    console.log('✅ Applications table created with company_name column');
    
    // Create admin user
    console.log('\n📝 Creating admin user...');
    const hashedPassword = bcrypt.hashSync('changeme123', 10);
    await connection.execute(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      ['demo@trackmyjobs.com', hashedPassword, 'Demo User']
    );
    console.log('✅ Demo user created');
    console.log('   Email: demo@trackmyjobs.com');
    console.log('   Password: changeme123');
    
    // Verify table structure
    console.log('\n📊 VERIFICATION:');
    const [users] = await connection.execute('SELECT id, email, display_name FROM users');
    console.log('\nUsers:', users);
    
    const [columns] = await connection.execute('DESCRIBE applications');
    console.log('\nApplications table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });
    
    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    console.log('\n=================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('Email: demo@trackmyjobs.com');
    console.log('Password: changeme123');
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();