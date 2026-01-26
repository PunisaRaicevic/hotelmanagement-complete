import { createClient } from '@supabase/supabase-js';

// Diagnostic logging for environment variables
console.log('[SUPABASE] Initializing Supabase client...');
console.log('[SUPABASE] SUPABASE_URL:', process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'NOT SET');
console.log('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `Length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length}, Starts with: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET');

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// Check if the key looks valid (JWT format)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey.startsWith('eyJ')) {
  console.error('[SUPABASE] WARNING: Service role key does not look like a valid JWT (should start with eyJ)');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('[SUPABASE] Client created successfully');
