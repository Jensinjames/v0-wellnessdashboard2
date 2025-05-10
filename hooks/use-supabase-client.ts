// hooks/use-supabase-client.ts
"use client"
import { useMemo } from "react"
import { getSupabaseClient } from "@/utils/supabase-client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export function useSupabaseClient(): SupabaseClient<Database> {
  return useMemo(() => getSupabaseClient(), [])
}
