// utils/supabase-client.ts
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

declare global {
  var __supabase: SupabaseClient<Database>
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    if (!globalThis.__supabase) {
      globalThis.__supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    }
    return globalThis.__supabase
  }
  // server-side: use service-role for privileged ops
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
