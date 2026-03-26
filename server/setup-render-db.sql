const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupRenderDatabase() {
  console.log('🚀 Setting up Render PostgreSQL Database\n');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into statements
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    console.log('\n Creating tables...');
    for (let statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.log(`   Statement error: ${err.message.substring(0, 100)}`);
          }
        }
      }
    }
    console.log(' Schema created');
    
    // Create demo user with actual hash
    const hashedPassword = bcrypt.hashSync('changeme123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash`,
      ['demo@trackmyjobs.com', hashedPassword, 'Demo User']
    );
    console.log('Demo user created/updated');
    
    // Verify tables
    const { rows: tables } = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log('\n Tables in database:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.tablename}`);
    });
    
    console.log('\n🎉 Render Database Setup Complete!');
    console.log('\n=================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('Email: demo@trackmyjobs.com');
    console.log('Password: changeme123');
    console.log('=================================');
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupRenderDatabase();