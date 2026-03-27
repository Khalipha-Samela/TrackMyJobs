const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Database configuration for Render PostgreSQL
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('📊 Database Configuration:');
console.log(`   Host: ${poolConfig.host || 'Not set'}`);
console.log(`   Database: ${poolConfig.database || 'Not set'}`);
console.log(`   User: ${poolConfig.user || 'Not set'}`);
console.log(`   SSL: ${poolConfig.ssl ? 'Enabled' : 'Disabled'}`);

const pool = new Pool(poolConfig);

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure PostgreSQL database is created on Render');
    console.log('2. Check environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.log('3. Verify database is linked to your web service');
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

module.exports = pool;