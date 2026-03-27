const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Render PostgreSQL Database\n');
  
  // Get database connection from environment variables
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
  
  console.log('📊 Database Config:');
  console.log(`   Host: ${dbConfig.host || 'Not set'}`);
  console.log(`   Database: ${dbConfig.database || 'Not set'}`);
  console.log(`   User: ${dbConfig.user || 'Not set'}`);
  
  if (!dbConfig.host || !dbConfig.user || !dbConfig.password) {
    console.error('\n❌ Missing database environment variables!');
    console.log('Please set: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  }
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    console.log('\n📝 Creating tables...');
    for (let statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.log(`   ⚠️ ${err.message.substring(0, 100)}`);
          }
        }
      }
    }
    console.log('✅ Schema created');
    
    // Create demo user
    console.log('\n👤 Creating demo user...');
    const hashedPassword = bcrypt.hashSync('changeme123', 10);
    
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING`,
      ['demo@trackmyjobs.com', hashedPassword, 'Demo User']
    );
    console.log('✅ Demo user created');
    
    // Get user ID
    const { rows: userRows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@trackmyjobs.com']
    );
    const userId = userRows[0]?.id;
    
    if (userId) {
      // Check if applications exist
      const { rows: appRows } = await pool.query(
        'SELECT COUNT(*) FROM applications WHERE user_id = $1',
        [userId]
      );
      
      if (parseInt(appRows[0].count) === 0) {
        console.log('\n📊 Adding sample applications...');
        
        const sampleApps = [
          ['Google', 'Frontend Developer', 'https://careers.google.com', '2024-03-15', 'Interview', 'Technical interview scheduled'],
          ['Microsoft', 'React Developer', 'https://careers.microsoft.com', '2024-03-10', 'Applied', 'Waiting for response'],
          ['Amazon', 'Frontend Engineer', 'https://amazon.jobs', '2024-03-05', 'Rejected', 'Need more practice'],
          ['Apple', 'UI Developer', 'https://apple.com', '2024-02-28', 'Offer', 'Received offer!'],
          ['Netflix', 'React Developer', 'https://netflix.com', '2024-02-20', 'Interview', 'Second round completed']
        ];
        
        for (const app of sampleApps) {
          await pool.query(
            `INSERT INTO applications (user_id, company_name, job_title, job_link, application_date, status, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, ...app]
          );
        }
        console.log(`✅ Added ${sampleApps.length} sample applications`);
      }
    }
    
    // Show statistics
    const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
    const { rows: appCount } = await pool.query('SELECT COUNT(*) FROM applications');
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Applications: ${appCount[0].count}`);
    
    console.log('\n🎉 Database Setup Complete!');
    console.log('\n=================================');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('📧 Email: demo@trackmyjobs.com');
    console.log('🔒 Password: changeme123');
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

setupDatabase();