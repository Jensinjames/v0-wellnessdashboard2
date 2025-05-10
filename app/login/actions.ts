"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Database } from "@/types/database"

/**
 * Server action to handle user login
 * Sets auth cookies and redirects on success
 */
export async function login(formData: FormData) {
  // Create a Supabase client for the server action
  const supabase = createServerActionClient<Database>({ cookies })

  // Get form data
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard"

  try {
    // Attempt to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Handle authentication errors
    if (error) {
      return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    // Ensure any getSession() calls on the next render see the new cookie
    revalidatePath("/", "layout")

    // Redirect to the dashboard or the requested page
    return redirect(redirectTo)
  } catch (error) {
    // Handle unexpected errors
    console.error("Login error:", error)
    return redirect("/login?message=An unexpected error occurred")
  }
}
