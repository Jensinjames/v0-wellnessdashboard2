"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function signIn(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function signUp(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // If sign up is successful and we have a user, create a profile in the users table
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
        name,
      })

      if (profileError) {
        console.error("Error creating user profile:", profileError)
        // We don't want to fail the sign up if profile creation fails
        // The user can create their profile later
      }
    }

    return { success: true, data: authData }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get("email") as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const location = formData.get("location") as string

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { name },
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Update user profile in the users table
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
      return { success: false, error: profileError.message }
    }

    // Revalidate the profile page to show updated data
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
