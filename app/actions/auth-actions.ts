"use server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function signIn(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "An error occurred during sign in" }
  }
}

export async function signUp(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (!email || !password || !name) {
      return { error: "All fields are required" }
    }

    const supabase = createServerSupabaseClient()

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
      return { error: authError.message }
    }

    // Create user profile in the users table
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
        name,
      })

      if (profileError) {
        return { error: profileError.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "An error occurred during sign up" }
  }
}

export async function signOut() {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    return { error: "Failed to sign out" }
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get("email") as string

    if (!email) {
      return { error: "Email is required" }
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "An error occurred during password reset" }
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const location = formData.get("location") as string
    const id = formData.get("id") as string

    if (!id) {
      return { error: "User ID is required" }
    }

    const supabase = createServerSupabaseClient()

    // Update user metadata in auth
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        name,
      },
    })

    if (authError) {
      return { error: authError.message }
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
      .eq("id", id)

    if (profileError) {
      return { error: profileError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "An error occurred while updating profile" }
  }
}
