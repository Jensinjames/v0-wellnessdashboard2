import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "@/types/database"

/**
 * Creates a Supabase client for server components
 * Cached to prevent multiple instances in a single request
 */
export const createClient = cache(() => {
  const cookieStore = cookies()

  return createServerComponentClient<Database>(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )
})
