import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

declare global {
  // Allow reuse across HMR
  var supabase: SupabaseClient<Database> | undefined
}

export function getSupabaseClient(): SupabaseClient<Database> {
  // If in browser, stash on global to persist across hot-reloads
  if (typeof window !== "undefined") {
    if (!global.supabase) {
      global.supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    }
    return global.supabase
  }

  // On server we can just create a fresh one
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key for consistency
  )
}
