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
  
  console.log('📊 Database Config:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log(' Connected to PostgreSQL');
    
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
    console.log('✅ Updated_at trigger created');
    
    // ============ ADD SAMPLE DATA ============
    console.log('\n Adding sample data from your SQL file...');
    
    // Insert demo user (with your provided hash)
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name`,
      ['demo@trackmyjobs.com', '$2b$10$6QzQu1gh87jj.wgJ/VxPBOECJCEo6NV7DAywXe3TEP4lRsgIPLRXW', 'Demo User']
    );
    console.log(' Demo user created');
    
    // Get demo user ID
    const { rows: demoUser } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@trackmyjobs.com']
    );
    const demoUserId = demoUser[0].id;
    
    // Check if sample applications already exist
    const { rows: existingApps } = await pool.query(
      'SELECT COUNT(*) FROM applications WHERE user_id = $1',
      [demoUserId]
    );
    
    if (parseInt(existingApps[0].count) === 0) {
      console.log(' Inserting sample applications...');
      
      // Insert sample applications (converted from your MySQL data)
      const sampleApps = [
        {
          company: 'Google',
          title: 'Frontend Developer',
          link: 'https://careers.google.com/jobs/123',
          days_ago: 5,
          status: 'Interview',
          notes: 'Had initial phone screen. Technical interview scheduled for next week.'
        },
        {
          company: 'Microsoft',
          title: 'React Developer',
          link: 'https://careers.microsoft.com/jobs/456',
          days_ago: 10,
          status: 'Applied',
          notes: 'Application submitted. Waiting for response.'
        },
        {
          company: 'Amazon',
          title: 'Frontend Engineer',
          link: 'https://amazon.jobs/789',
          days_ago: 15,
          status: 'Rejected',
          notes: 'Got rejection after technical assessment.'
        },
        {
          company: 'Apple',
          title: 'UI Developer',
          link: 'https://apple.com/jobs/321',
          days_ago: 20,
          status: 'Offer',
          notes: 'Received offer! Negotiating salary.'
        },
        {
          company: 'Netflix',
          title: 'Senior React Developer',
          link: 'https://netflix.com/jobs/654',
          days_ago: 25,
          status: 'Interview',
          notes: 'Second round interview completed. Waiting for feedback.'
        },
        {
          company: 'Meta',
          title: 'Software Engineer',
          link: 'https://meta.com/jobs/987',
          days_ago: 30,
          status: 'Applied',
          notes: 'Application submitted through referral.'
        }
      ];
      
      for (const app of sampleApps) {
        await pool.query(
          `INSERT INTO applications 
           (user_id, company_name, job_title, job_link, application_date, status, notes)
           VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '1 day' * $5, $6, $7)`,
          [demoUserId, app.company, app.title, app.link, app.days_ago, app.status, app.notes]
        );
      }
      
      console.log(` Added ${sampleApps.length} sample applications for demo user`);
    } else {
      console.log(' Sample applications already exist, skipping...');
    }
    
    // Show statistics
    console.log('\n📊 Database Statistics:');
    const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   Users: ${userCount[0].count}`);
    
    const { rows: appCount } = await pool.query('SELECT COUNT(*) FROM applications');
    console.log(`   Applications: ${appCount[0].count}`);
    
    const { rows: statusStats } = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status 
      ORDER BY status
    `);
    console.log('\n   Applications by status:');
    statusStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat.count}`);
    });
    
    const { rows: recentApps } = await pool.query(`
      SELECT company_name, job_title, status, application_date 
      FROM applications 
      WHERE user_id = $1 
      ORDER BY application_date DESC 
      LIMIT 5
    `, [demoUserId]);
    
    console.log('\n   Recent applications:');
    recentApps.forEach(app => {
      console.log(`   - ${app.company_name}: ${app.job_title} (${app.status})`);
    });
    
    console.log('\n🎉 Database Setup Complete!');
    console.log('\n=================================');
    console.log(' LOGIN CREDENTIALS:');
    console.log('Demo Email: demo@trackmyjobs.com');
    console.log('Demo Password: changeme123');
    console.log('=================================');
    console.log('\n Sample data included:');
    console.log('   - Demo user with 6 sample applications');
    console.log('=================================');
    
  } catch (error) {
    console.error(' Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

setupRenderDatabase();