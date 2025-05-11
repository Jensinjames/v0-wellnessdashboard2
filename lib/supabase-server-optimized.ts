"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export async function withPooledConnection<T>(fn: (supabase: SupabaseClient<Database>) => Promise<T>): Promise<T> {
  const supabase = createServerSupabaseClient()
  try {
    return await fn(supabase)
  } catch (error) {
    console.error("Error in withPooledConnection:", error)
    throw error
  }
}

export async function resetConnectionPool() {
  console.warn("resetConnectionPool is a no-op in this implementation")
}
