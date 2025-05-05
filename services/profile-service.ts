import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// This is a client-side helper that doesn't use server-only features
export async function ensureProfileExists(userId: string, email: string, supabase: any): Promise<Profile | null> {
  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (!checkError && existingProfile) {
      return existingProfile as Profile
    }

    // Create new profile
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Use upsert to handle race conditions
    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(newProfile, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return null
    }

    return profile as Profile
  } catch (error) {
    console.error("Unexpected error in ensureProfileExists:", error)
    return null
  }
}
