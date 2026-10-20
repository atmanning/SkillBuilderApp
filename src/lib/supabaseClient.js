import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// isSupabaseConfigured is checked by dataService.js and AuthContext.jsx to
// decide whether to talk to a real Supabase project or fall back to the
// local mock data store. This lets the app run immediately after `npm
// install` with zero backend setup, and then "switch on" real persistence
// the moment real credentials are added to .env.local.
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
