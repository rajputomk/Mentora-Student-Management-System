import { createClient } from '@supabase/supabase-js'

// You can find these values in your Supabase Dashboard:
// Project Settings -> API -> Project URL & Project API Keys (anon public)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
