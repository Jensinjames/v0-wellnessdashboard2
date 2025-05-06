import type { UserProfile } from "@/types/auth"

// Check if a profile is complete (has first name and last name)
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false
  return !!profile.first_name && !!profile.last_name
}

// Create profile via API
export async function createProfileViaAPI(userId: string, email: string) {
  try {
    const response = await fetch("/api/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { profile: null, error: new Error(errorData.error || "Failed to create profile") }
    }

    const data = await response.json()
    return { profile: data.profile, error: null }
  } catch (error) {
    console.error("Error creating profile via API:", error)
    return { profile: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}
