const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 Supabase Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

module.exports = supabase;