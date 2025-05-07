import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a singleton instance for the browser
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - create a new instance each time
    return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  // Client-side - use singleton pattern
  if (!clientInstance) {
    clientInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    )
  }

  return clientInstance
}

// Export a direct instance for convenience
export const supabase = getSupabaseClient()
