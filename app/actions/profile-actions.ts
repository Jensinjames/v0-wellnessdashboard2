"use server"

import { createActionSupabaseClient } from "@/lib/supabase"

export async function updateUserProfile(formData: FormData) {
  const supabase = createActionSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const location = formData.get("location") as string

  // Update user metadata in auth
  const { error: authError } = await supabase.auth.updateUser({
    data: { name },
  })

  if (authError) {
    return { error: authError.message }
  }

  // Update user profile in users table
  const { error: profileError } = await supabase
    .from("users")
    .update({
      name,
      phone,
      location,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  return { success: true }
}

export async function getUserProfile() {
  const supabase = createActionSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get user profile from users table
  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, profile: data }
}

export async function updatePassword(formData: FormData) {
  const supabase = createActionSupabaseClient()
  const password = formData.get("password") as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
