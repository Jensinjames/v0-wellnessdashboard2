import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Helper function to delay execution (for retry logic)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// This is a client-side helper that doesn't use server-only features
export async function ensureProfileExists(userId: string, email: string, supabase: any): Promise<Profile | null> {
  try {
    // First check if profile exists
    try {
      const {
        data: existingProfile,
        error: checkError,
        status,
      } = await supabase.from("profiles").select("*").eq("id", userId).single()

      // Handle rate limiting
      if (status === 429 || (checkError && checkError.message?.includes("Too Many Requests"))) {
        console.log("Rate limited during profile check, waiting 2 seconds...")
        await delay(2000)
        return ensureProfileExists(userId, email, supabase)
      }

      if (!checkError && existingProfile) {
        return existingProfile as Profile
      }
    } catch (error: any) {
      // If we get a rate limiting error
      if (error.message?.includes("Too Many Requests") || error.message?.includes("429")) {
        console.log("Rate limited during profile check, waiting 2 seconds...")
        await delay(2000)
        return ensureProfileExists(userId, email, supabase)
      }
      console.error("Error checking if profile exists:", error)
    }

    // Create new profile
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Use upsert to handle race conditions
    try {
      const {
        data: profile,
        error,
        status,
      } = await supabase.from("profiles").upsert(newProfile, { onConflict: "id" }).select().single()

      // Handle rate limiting
      if (status === 429 || (error && error.message?.includes("Too Many Requests"))) {
        console.log("Rate limited during profile creation, waiting 2 seconds...")
        await delay(2000)
        return ensureProfileExists(userId, email, supabase)
      }

      if (error) {
        console.error(`Error creating profile (status ${status}):`, error)
        return null
      }

      return profile as Profile
    } catch (error: any) {
      // If we get a rate limiting error
      if (error.message?.includes("Too Many Requests") || error.message?.includes("429")) {
        console.log("Rate limited during profile creation, waiting 2 seconds...")
        await delay(2000)
        return ensureProfileExists(userId, email, supabase)
      }
      console.error("Error creating profile:", error)
      return null
    }
  } catch (error) {
    console.error("Unexpected error in ensureProfileExists:", error)
    return null
  }
}
