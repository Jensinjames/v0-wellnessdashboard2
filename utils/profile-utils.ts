/**
 * Creates a user profile via the server-side API route
 * This bypasses RLS policies by using the service role key
 */
export async function createProfileViaAPI(userId: string, email: string) {
  try {
    console.log(`Attempting to create profile via API for user ${userId}`)

    const response = await fetch("/api/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
    })

    const data = await response.json().catch(() => {
      console.error("Failed to parse API response")
      return { error: "Failed to parse API response" }
    })

    if (!response.ok) {
      console.error("Profile creation API error:", data.error || response.statusText)
      return {
        profile: null,
        error: new Error(data.error || `Failed to create profile: ${response.status}`),
      }
    }

    if (!data.profile) {
      console.error("No profile data returned from API:", data)
      return {
        profile: null,
        error: new Error("No profile data returned from API"),
      }
    }

    console.log("Profile created successfully via API:", data.profile)
    return { profile: data.profile, error: null }
  } catch (error: any) {
    console.error("Error creating profile via API:", error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

// Check if a profile is complete (has first name and last name)
export function isProfileComplete(profile: any): boolean {
  if (!profile) return false
  return !!profile.first_name && !!profile.last_name
}
