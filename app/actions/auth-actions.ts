"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createActionSupabaseClient } from "@/lib/supabase"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  const supabase = createActionSupabaseClient()

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  // Create user profile in the users table
  const { error: profileError } = await supabase.from("users").insert({
    id: data.user?.id,
    email,
    name,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  return { success: true }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = createActionSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = createActionSupabaseClient()
  await supabase.auth.signOut()
  cookies().delete("supabase-auth-token")
  redirect("/auth/login")
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string

  const supabase = createActionSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

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
  const phone = formData.get("phone") as string
  const location = formData.get("location") as string

  // Update auth metadata
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { name },
  })

  if (authUpdateError) {
    return { error: authUpdateError.message }
  }

  // Update profile in users table
  const { error: profileUpdateError } = await supabase
    .from("users")
    .update({
      name,
      phone,
      location,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileUpdateError) {
    return { error: profileUpdateError.message }
  }

  return { success: true, message: "Profile updated successfully" }
}
