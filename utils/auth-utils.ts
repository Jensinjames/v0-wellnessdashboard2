import type { Session, User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/auth"

/**
 * Check if a user is anonymous based on their auth provider
 */
export function isAnonymousUser(user?: User | null): boolean {
  if (!user) return false
  return user.app_metadata?.provider === "anonymous"
}

/**
 * Check if a session belongs to an anonymous user
 */
export function isAnonymousSession(session?: Session | null): boolean {
  if (!session || !session.user) return false
  return isAnonymousUser(session.user)
}

/**
 * Check if a profile is for an anonymous user
 */
export function isAnonymousProfile(profile?: UserProfile | null): boolean {
  if (!profile) return false
  return !!profile.is_anonymous
}

/**
 * Get a display name for a user, handling anonymous users
 */
export function getUserDisplayName(profile?: UserProfile | null): string {
  if (!profile) return "Guest"

  if (isAnonymousProfile(profile)) {
    return "Demo User"
  }

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`
  }

  if (profile.first_name) {
    return profile.first_name
  }

  return profile.email?.split("@")[0] || "User"
}

/**
 * Check if a user has completed their profile
 * Anonymous users are considered to have completed profiles
 */
export function hasCompletedProfile(profile?: UserProfile | null): boolean {
  if (!profile) return false

  // Anonymous users are considered to have completed profiles
  if (isAnonymousProfile(profile)) {
    return true
  }

  return !!(profile.first_name && profile.last_name)
}
