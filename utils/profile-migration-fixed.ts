import { getSupabaseClient } from "@/lib/supabase"
import type { UserProfile } from "@/types/profile"

// Track migration state to prevent infinite loops
const migrationState = new Map<
  string,
  {
    inProgress: boolean
    lastAttempt: number
    attempts: number
  }
>()

// Maximum number of migration attempts per user
const MAX_MIGRATION_ATTEMPTS = 3
// Cooldown period between migration attempts (in milliseconds)
const MIGRATION_COOLDOWN = 60000 // 1 minute

/**
 * Safely migrate a user profile with proper state tracking to prevent infinite loops
 */
export async function safelyMigrateProfile(userId: string): Promise<UserProfile | null> {
  // Check if migration is already in progress or has failed too many times
  const state = migrationState.get(userId) || { inProgress: false, lastAttempt: 0, attempts: 0 }

  // Prevent concurrent migrations for the same user
  if (state.inProgress) {
    console.log(`Migration already in progress for user ${userId}`)
    return null
  }

  // Check if we've exceeded max attempts
  if (state.attempts >= MAX_MIGRATION_ATTEMPTS) {
    console.error(`Maximum migration attempts reached for user ${userId}`)
    return null
  }

  // Check if we need to wait for cooldown
  const now = Date.now()
  if (state.lastAttempt > 0 && now - state.lastAttempt < MIGRATION_COOLDOWN) {
    console.log(`Migration cooldown period active for user ${userId}`)
    return null
  }

  // Update migration state
  migrationState.set(userId, {
    inProgress: true,
    lastAttempt: now,
    attempts: state.attempts + 1,
  })

  const supabase = getSupabaseClient()

  try {
    // Begin transaction
    // Note: Supabase doesn't support true transactions in the client library,
    // so we're implementing careful error handling instead

    // 1. Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw new Error(`Error fetching profile: ${fetchError.message}`)
    }

    // 2. If profile doesn't exist, create a new one
    if (!existingProfile) {
      // Get user data from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError || !userData?.user) {
        throw new Error(`Error fetching user data: ${userError?.message || "User not found"}`)
      }

      // Create basic profile
      const newProfile = {
        id: userId,
        email: userData.user.email || "",
        display_name: userData.user.user_metadata?.full_name || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {
          theme: "system",
          email_notifications: true,
          language: "en",
        },
        completion_status: {
          is_complete: false,
          completed_steps: [],
          current_step: "basic_info",
          percent_complete: 0,
        },
      }

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        throw new Error(`Error creating profile: ${createError.message}`)
      }

      // Reset migration state
      migrationState.set(userId, {
        inProgress: false,
        lastAttempt: now,
        attempts: state.attempts,
      })

      return createdProfile as UserProfile
    }

    // 3. If profile exists but needs migration
    if (existingProfile && needsMigration(existingProfile)) {
      const updates = generateProfileUpdates(existingProfile)

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`)
      }

      // Reset migration state
      migrationState.set(userId, {
        inProgress: false,
        lastAttempt: now,
        attempts: state.attempts,
      })

      return updatedProfile as UserProfile
    }

    // Profile exists and doesn't need migration
    migrationState.set(userId, {
      inProgress: false,
      lastAttempt: now,
      attempts: state.attempts,
    })

    return existingProfile as UserProfile
  } catch (error) {
    console.error(`Migration failed for user ${userId}:`, error)

    // Reset in-progress flag but keep attempt count
    migrationState.set(userId, {
      inProgress: false,
      lastAttempt: now,
      attempts: state.attempts,
    })

    return null
  }
}

/**
 * Check if a profile needs migration
 */
function needsMigration(profile: any): boolean {
  // Check for required fields in the new schema
  return !profile.preferences || !profile.completion_status || typeof profile.email_notifications === "undefined"
}

/**
 * Generate updates for profile migration
 */
function generateProfileUpdates(profile: any): any {
  return {
    display_name: profile.full_name || profile.username || "",
    preferences: profile.preferences || {
      theme: profile.theme_preference || "system",
      email_notifications: profile.email_notifications !== false,
      language: profile.language || "en",
      accessibility: {
        high_contrast: false,
        reduced_motion: false,
        large_text: false,
      },
    },
    completion_status: profile.completion_status || {
      is_complete: false,
      completed_steps: [],
      current_step: "basic_info",
      percent_complete: 0,
    },
    updated_at: new Date().toISOString(),
  }
}

/**
 * Clear migration state for testing
 */
export function resetMigrationState(userId?: string): void {
  if (userId) {
    migrationState.delete(userId)
  } else {
    migrationState.clear()
  }
}
