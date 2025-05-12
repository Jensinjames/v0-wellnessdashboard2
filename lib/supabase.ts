import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Types for our database
export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          location: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Server-side Supabase client (using SSR)
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
})

// Client-side Supabase client (singleton pattern)
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return browserClient
}

// For server actions
export function createActionSupabaseClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
