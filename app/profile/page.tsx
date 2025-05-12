import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import ProfileClient from "@/components/profile-client"
import type { Database } from "@/types/supabase"

export default async function ProfilePage() {
  const cookieStore = cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    },
  )

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // If not authenticated, redirect to login
    redirect("/auth/login?redirect=/profile")
  }

  // Get the user's profile data
  const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  return <ProfileClient user={session.user} profile={profile} />
}
