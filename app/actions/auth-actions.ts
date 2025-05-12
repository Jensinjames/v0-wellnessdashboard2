"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { handleSupabaseError } from "@/utils/supabase-error-handler"

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Helper to create a server client for auth actions
function createActionClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  })
}

// Sign in with email and password
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirectTo") as string) || "/profile"

  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required",
    }
  }

  try {
    const supabase = createActionClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      redirectTo,
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Sign up with email and password
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const redirectTo = (formData.get("redirectTo") as string) || "/profile"

  if (!email || !password || !name) {
    return {
      success: false,
      error: "Name, email, and password are required",
    }
  }

  try {
    const supabase = createActionClient()

    // Get the base URL for the callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const callbackUrl = `${baseUrl}/auth/callback`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: callbackUrl,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: "Check your email for the confirmation link",
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Sign out
export async function signOut() {
  const supabase = createActionClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Reset password
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return {
      success: false,
      error: "Email is required",
    }
  }

  try {
    const supabase = createActionClient()

    // Get the base URL for the callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/auth/reset-password/confirm`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Reset password error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Update password
export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string

  if (!password) {
    return {
      success: false,
      error: "Password is required",
    }
  }

  try {
    const supabase = createActionClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Update password error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

// Get the current session
export async function getSession() {
  const supabase = createActionClient()

  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return null
  }

  return data.session
}

// Get the current user
export async function getUser() {
  const session = await getSession()

  if (!session) {
    return null
  }

  return session.user
}

// Update user profile
export async function updateUserProfile(formData: FormData) {
  const supabase = createActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const location = formData.get("location") as string

    const { error } = await supabase
      .from("users")
      .update({
        name,
        phone,
        location,
      })
      .eq("id", user.id)

    if (error) {
      const errorInfo = handleSupabaseError(error, "Failed to update profile")
      return { success: false, error: errorInfo.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
