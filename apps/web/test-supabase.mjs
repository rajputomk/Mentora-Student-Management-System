import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqbgmuaowlqrnhbsfita.supabase.co';
const supabaseAnonKey = 'sb_publishable_vLC0En3Mqjzgw3eA6-dVpw_IeQZq4jW';

console.log("Connecting to:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
       console.log("Database connection successful, but got an error (expected if 'users' table doesn't exist or isn't public):", error.message);
    } else {
       console.log("Database connection successful! Data:", data);
    }
  } catch (e) {
    console.error("Failed to connect:", e);
  }
}

testConnection();
