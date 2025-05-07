"use server"
import { redirect } from "next/navigation"
import { createServerActionClient } from "@/lib/supabase-ssr"

/**
 * Signs the user out and redirects to the sign-in page
 */
export async function signOut() {
  const supabase = createServerActionClient()
  await supabase.auth.signOut()
  redirect("/auth/sign-in")
}
