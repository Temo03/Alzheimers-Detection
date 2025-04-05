import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are defined
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // Ensures session persists after refresh
    storage: typeof window !== "undefined" ? localStorage : undefined,
    autoRefreshToken: true, // Automatically refresh session tokens
    detectSessionInUrl: true, // Required for OAuth sign-ins
  },
});

// Expose Supabase globally for debugging in browser console
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}
