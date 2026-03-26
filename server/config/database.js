const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Database configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trackmyjobs',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('Database Configuration:');
console.log(`   Host: ${poolConfig.host}`);
console.log(`   Database: ${poolConfig.database}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

const pool = new Pool(poolConfig);

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if database exists');
    console.log('2. Verify credentials in .env file');
    console.log('3. Run: node setup-db.js to create database');
  } else {
    console.log('Database connected successfully');
    release();
  }
});

module.exports = pool;