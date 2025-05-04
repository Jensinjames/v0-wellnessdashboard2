import { getSupabaseClient } from "@/lib/supabase"
import type { FullProfile } from "@/types/profile"
import type { UserProfile, UserPreferences } from "@/types/profile"

interface LegacyProfile {
  id: string
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  email?: string
  created_at: string
  updated_at: string
  settings?: {
    theme?: string
    notifications?: boolean
    language?: string
  }
}

// Check if the profiles table has the required columns
export async function checkProfilesTable(): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    // Try to select a column that should exist in the updated schema
    const { error } = await supabase.from("profiles").select("username").limit(1)

    // If there's no error, the column exists
    if (!error) {
      return true
    }

    // If the error is about the column not existing, we need to migrate
    if (error.message.includes("column") && error.message.includes("does not exist")) {
      return false
    }

    // For other errors, log and return false
    console.error("Error checking profiles table:", error)
    return false
  } catch (error) {
    console.error("Exception checking profiles table:", error)
    return false
  }
}

// Migrate the profiles table to the new schema
export async function migrateProfilesTable(): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    // Add new columns to the profiles table
    const alterTableQueries = [
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"activity_updates": true, "new_features": true, "marketing": false}';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{"high_contrast": false, "reduced_motion": false, "larger_text": false}';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completion_status JSONB DEFAULT '{"completed_steps": [], "current_step": "basic_info", "is_complete": false, "completion_percentage": 0}';`,
    ]

    // Execute each query
    for (const query of alterTableQueries) {
      const { error } = await supabase.rpc("exec_sql", { sql: query })

      if (error) {
        console.error(`Error executing query: ${query}`, error)
        return false
      }
    }

    console.log("Profiles table migration completed successfully")
    return true
  } catch (error) {
    console.error("Exception migrating profiles table:", error)
    return false
  }
}

// Migrate a single profile to the new format
export async function migrateProfile(userId: string): Promise<FullProfile | null> {
  const supabase = getSupabaseClient()

  try {
    // Get the current profile
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile for migration:", error)
      return null
    }

    // Default values for new fields
    const updates: Partial<FullProfile> = {
      username: profile.username || null,
      bio: profile.bio || null,
      location: profile.location || null,
      website: profile.website || null,
      theme_preference: profile.theme_preference || "system",
      email_notifications: profile.email_notifications !== false,
      notification_preferences: profile.notification_preferences || {
        activity_updates: true,
        new_features: true,
        marketing: false,
      },
      timezone: profile.timezone || null,
      language: profile.language || "en",
      accessibility_settings: profile.accessibility_settings || {
        high_contrast: false,
        reduced_motion: false,
        larger_text: false,
      },
    }

    // Update the profile with new fields
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating profile during migration:", updateError)
      return null
    }

    return updatedProfile as FullProfile
  } catch (error) {
    console.error("Exception migrating profile:", error)
    return null
  }
}

// Migrate all profiles
export async function migrateAllProfiles(): Promise<number> {
  const supabase = getSupabaseClient()
  let migratedCount = 0

  try {
    // Get all user IDs
    const { data: users, error } = await supabase.from("profiles").select("id")

    if (error) {
      console.error("Error fetching users for migration:", error)
      return 0
    }

    // Migrate each profile
    for (const user of users) {
      const migratedProfile = await migrateProfile(user.id)
      if (migratedProfile) {
        migratedCount++
      }
    }

    console.log(`Successfully migrated ${migratedCount} profiles`)
    return migratedCount
  } catch (error) {
    console.error("Exception migrating all profiles:", error)
    return migratedCount
  }
}

export async function migrateUserProfiles(): Promise<{ success: boolean; migrated: number; errors: number }> {
  const supabase = getSupabaseClient()
  let migrated = 0
  let errors = 0

  try {
    // Fetch all legacy profiles
    const { data: legacyProfiles, error: fetchError } = await supabase.from("profiles").select("*")

    if (fetchError) {
      console.error("Error fetching legacy profiles:", fetchError)
      return { success: false, migrated: 0, errors: 0 }
    }

    // Process each legacy profile
    for (const legacyProfile of legacyProfiles as LegacyProfile[]) {
      try {
        // Check if a migrated profile already exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("userId", legacyProfile.user_id)
          .single()

        if (existingProfile) {
          // Profile already migrated, skip
          continue
        }

        // Transform legacy profile to new format
        const newProfile = transformLegacyProfile(legacyProfile)

        // Insert the new profile
        const { error: insertError } = await supabase.from("user_profiles").insert(newProfile)

        if (insertError) {
          console.error(`Error migrating profile ${legacyProfile.id}:`, insertError)
          errors++
        } else {
          migrated++
        }
      } catch (err) {
        console.error(`Unexpected error migrating profile ${legacyProfile.id}:`, err)
        errors++
      }
    }

    return { success: true, migrated, errors }
  } catch (error) {
    console.error("Fatal error during profile migration:", error)
    return { success: false, migrated: 0, errors: 0 }
  }
}

function transformLegacyProfile(legacyProfile: LegacyProfile): UserProfile {
  // Map legacy profile fields to the new UserProfile and UserPreferences
  const userProfile: UserProfile = {
    userId: legacyProfile.user_id,
    username: legacyProfile.username || null,
    fullName: legacyProfile.full_name || null,
    avatarUrl: legacyProfile.avatar_url || null,
    email: legacyProfile.email || null,
    createdAt: legacyProfile.created_at,
    updatedAt: legacyProfile.updated_at,
    // Initialize other fields with default values or handle null/undefined
    bio: null,
    location: null,
    website: null,
    preferences: transformLegacySettings(legacyProfile.settings),
    completionStatus: {
      completedSteps: [],
      currentStep: "basic_info",
      isComplete: false,
      completionPercentage: 0,
    },
  }

  return userProfile
}

function transformLegacySettings(legacySettings: LegacyProfile["settings"]): UserPreferences {
  const userPreferences: UserPreferences = {
    themePreference: legacySettings?.theme || "system",
    emailNotifications: legacySettings?.notifications !== false,
    notificationPreferences: {
      activity_updates: true,
      new_features: true,
      marketing: false,
    },
    language: legacySettings?.language || "en",
    timezone: null,
    accessibilitySettings: {
      highContrast: false,
      reducedMotion: false,
      largerText: false,
    },
  }
  return userPreferences
}
