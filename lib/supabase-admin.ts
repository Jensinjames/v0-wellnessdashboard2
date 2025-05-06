import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Ensure this is only used on the server
if (typeof window !== "undefined") {
  throw new Error("supabase-admin can only be used on the server")
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations")
}

// Create a single supabase admin client for interacting with your database with elevated privileges
const supabaseAdmin = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export { supabaseAdmin }
