import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Helper function to delay execution (for retry logic)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function ensureProfileExists(userId: string, email: string, retryCount = 0): Promise<Profile | null> {
  try {
    // Add a small delay before retrying to avoid rate limiting
    if (retryCount > 0) {
      await delay(retryCount * 500)
    }

    const supabase = createClient()

    // First check if profile exists
    const {
      data: existingProfile,
      error: checkError,
      status: checkStatus,
    } = await supabase.from("profiles").select("*").eq("id", userId).single()

    // Handle rate limiting
    if (checkStatus === 429 && retryCount < 3) {
      console.log(`Rate limited during profile check, retrying in ${(retryCount + 1) * 1000}ms...`)
      return ensureProfileExists(userId, email, retryCount + 1)
    }

    if (!checkError && existingProfile) {
      return existingProfile as Profile
    }

    // Create new profile with retry mechanism
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Use upsert to handle race conditions
    const {
      data: profile,
      error,
      status,
    } = await supabase.from("profiles").upsert(newProfile, { onConflict: "id" }).select().single()

    // Handle rate limiting
    if (status === 429 && retryCount < 3) {
      console.log(`Rate limited during profile creation, retrying in ${(retryCount + 1) * 1000}ms...`)
      return ensureProfileExists(userId, email, retryCount + 1)
    }

    if (error) {
      console.error(`Error creating profile (status ${status}):`, error)
      return null
    }

    return profile as Profile
  } catch (error) {
    console.error("Unexpected error in ensureProfileExists:", error)
    return null
  }
}
