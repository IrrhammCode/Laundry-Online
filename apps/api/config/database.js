const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Try to load .env from root directory
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Fallback to current directory
  require('dotenv').config();
}

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection (async, don't block startup)
const testConnection = async () => {
  try {
    // Test query to verify connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected on first run)
      throw error;
    }
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️  Supabase connected, but tables not yet created. Run migration script.');
    } else {
      console.error('❌ Supabase connection failed:', error.message);
      // Don't exit in serverless environment (Vercel)
      if (process.env.VERCEL !== '1' && require.main === module) {
        process.exit(1);
      }
    }
  }
};

// Initialize connection test (non-blocking)
// Don't await - let it run in background
if (require.main === module || process.env.NODE_ENV !== 'production') {
  testConnection();
}

module.exports = supabase;
