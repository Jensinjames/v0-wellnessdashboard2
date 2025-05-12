import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import ProfileClient from "@/components/profile-client"

export default async function ProfilePage() {
  const supabase = createServerClient()

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
