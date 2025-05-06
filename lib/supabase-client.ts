import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// These environment variables are set by Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a singleton instance for the client-side
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side: Create a new instance each time
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Client-side: Use singleton pattern to prevent multiple instances
  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return clientInstance
}

// Server-side admin client with service role permissions
export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin should only be called on the server")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
