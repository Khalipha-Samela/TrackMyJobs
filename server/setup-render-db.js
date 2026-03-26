const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupRenderDatabase() {
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
  
  console.log(' Database Config:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
    
    // Check if tables exist
    const { rows: tables } = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const existingTables = tables.map(t => t.tablename);
    
    // Create users table if not exists
    if (!existingTables.includes('users')) {
      console.log('\n Creating users table...');
      await pool.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(' Users table created');
    } else {
      console.log(' Users table already exists');
    }
    
    // Create applications table if not exists
    if (!existingTables.includes('applications')) {
      console.log('\n Creating applications table...');
      await pool.query(`
        CREATE TABLE applications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_name VARCHAR(255) NOT NULL,
            job_title VARCHAR(255) NOT NULL,
            job_link VARCHAR(500),
            application_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'Applied',
            notes TEXT,
            cv_filename VARCHAR(255),
            cv_original_name VARCHAR(255),
            cv_mime_type VARCHAR(100),
            cv_size INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT valid_status CHECK (status IN ('Applied', 'Interview', 'Rejected', 'Offer'))
        )
      `);
      console.log(' Applications table created');
      
      // Create indexes
      await pool.query('CREATE INDEX idx_applications_user_id ON applications(user_id)');
      await pool.query('CREATE INDEX idx_applications_status ON applications(status)');
      await pool.query('CREATE INDEX idx_applications_date ON applications(application_date)');
      console.log(' Indexes created');
    } else {
      console.log(' Applications table already exists');
    }
    
    // Create updated_at trigger
    console.log('\n Setting up updated_at trigger...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
      CREATE TRIGGER update_applications_updated_at 
          BEFORE UPDATE ON applications 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log(' Updated_at trigger created');
    
    // Create demo user
    console.log('\n Creating/updating demo user...');
    const hashedPassword = bcrypt.hashSync('changeme123', 10);
    
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name`,
      ['demo@trackmyjobs.com', hashedPassword, 'Demo User']
    );
    console.log(' Demo user created/updated');
    
    // Verify setup
    console.log('\n Database Verification:');
    
    const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   Users: ${userCount[0].count}`);
    
    const { rows: appCount } = await pool.query('SELECT COUNT(*) FROM applications');
    console.log(`   Applications: ${appCount[0].count}`);
    
    const { rows: tableList } = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log(`   Tables: ${tableList.map(t => t.tablename).join(', ')}`);
    
    console.log('\n🎉 Database Setup Complete!');
    console.log('\n=================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('Email: demo@trackmyjobs.com');
    console.log('Password: changeme123');
    console.log('=================================');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

setupRenderDatabase();