"use client"

import { getSupabaseClient } from "@/lib/supabase-client"

export function useSupabase() {
  const supabase = getSupabaseClient()
  return supabase
}
