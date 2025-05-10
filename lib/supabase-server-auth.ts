import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

/**
 * Get authenticated user on the server side
 * @param redirectTo Where to redirect if not authenticated
 * @returns User object if authenticated
 */
export async function getServerUser(redirectTo?: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && redirectTo) {
    redirect(redirectTo)
  }

  return session?.user || null
}

/**
 * Create a Supabase client for server components
 */
export function createServerComponentSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
