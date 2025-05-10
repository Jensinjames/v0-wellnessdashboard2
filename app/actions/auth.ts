"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Database } from "@/types/database"

/**
 * Server action to handle user sign-out
 * Clears auth cookies and redirects to login
 */
export async function signOut() {
  const supabase = createServerActionClient<Database>({ cookies })

  try {
    // Sign out the user
    await supabase.auth.signOut()

    // Ensure session data is updated
    revalidatePath("/", "layout")

    // Redirect to login page
    return redirect("/login?message=You have been signed out")
  } catch (error) {
    console.error("Sign out error:", error)
    return redirect("/dashboard?error=Failed to sign out")
  }
}
