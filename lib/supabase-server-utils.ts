import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Create a server-side Supabase client
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Get the current session server-side
export async function getServerSession() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Get the current user server-side
export async function getServerUser() {
  const session = await getServerSession()
  return session?.user || null
}

// Check if the user is authenticated server-side
export async function isAuthenticated() {
  const user = await getServerUser()
  return !!user
}

// Get a user's profile server-side
export async function getServerProfile(userId: string) {
  if (!userId) return null

  const supabase = createServerSupabase()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile server-side:", error)
    return null
  }

  return data
}
