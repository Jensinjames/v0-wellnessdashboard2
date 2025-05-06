"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getProfile(userId: string): Promise<Profile | null> {
  const cookieStore = cookies()

  const supabase = createClient(
    (name) => cookieStore.get(name)?.value,
    (name, value, options) => cookieStore.set({ name, value, ...options }),
  )

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(
  userId: string,
  profile: Partial<Profile>,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies()

  const supabase = createClient(
    (name) => cookieStore.get(name)?.value,
    (name, value, options) => cookieStore.set({ name, value, ...options }),
  )

  const { error } = await supabase
    .from("profiles")
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
