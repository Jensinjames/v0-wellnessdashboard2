import * as z from "zod"

export interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
  username?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  theme_preference?: string | null
  email_notifications?: boolean
  notification_preferences?: any
  timezone?: string
  language?: string
  accessibility_settings?: any
  completion_status?: any
}

export type FullProfile = UserProfile

export type ProfileUpdateData = Pick<UserProfile, "full_name" | "username" | "bio" | "location" | "website">

export type PreferencesUpdateData = Pick<
  UserProfile,
  "theme_preference" | "email_notifications" | "notification_preferences" | "timezone" | "language"
>

export interface ProfileCompletionStatus {
  completed_steps: string[]
  current_step: ProfileCompletionStep
  is_complete: boolean
  completion_percentage: number
}

export type ProfileCompletionStep = "basic_info" | "profile_picture" | "preferences" | "notifications" | "accessibility"

export interface UserPreferences {
  themePreference: string | null
  emailNotifications: boolean
  notificationPreferences: {
    activity_updates: boolean
    new_features: boolean
    marketing: boolean
  }
  language: string | null
  timezone: string | null
  accessibilitySettings: {
    highContrast: boolean
    reducedMotion: boolean
    largerText: boolean
  }
}

export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  username: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  theme_preference: z.string().optional(),
  email_notifications: z.boolean().optional(),
  notification_preferences: z.any().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  accessibility_settings: z.any().optional(),
  completion_status: z.any().optional(),
})

export const preferencesSchema = z.object({
  theme_preference: z.enum(["light", "dark", "system"]).optional(),
  email_notifications: z.boolean().optional(),
  notification_preferences: z
    .object({
      activity_updates: z.boolean().optional(),
      new_features: z.boolean().optional(),
      marketing: z.boolean().optional(),
    })
    .optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
})

export function calculateProfileCompletion(profile: FullProfile): ProfileCompletionStatus {
  const completedSteps: string[] = []
  let currentStep: ProfileCompletionStep = "basic_info"
  let completionPercentage = 0

  // Basic info is always considered the first step
  if (profile.full_name && profile.username) {
    completedSteps.push("basic_info")
  }

  // Profile picture is the second step
  if (profile.avatar_url) {
    completedSteps.push("profile_picture")
  }

  // Preferences are the third step
  if (profile.theme_preference && profile.language) {
    completedSteps.push("preferences")
  }

  // Notifications are the fourth step
  if (profile.email_notifications !== undefined && profile.notification_preferences) {
    completedSteps.push("notifications")
  }

  // Accessibility is the fifth step
  if (profile.accessibility_settings) {
    completedSteps.push("accessibility")
  }

  // Determine current step
  if (!profile.full_name || !profile.username) {
    currentStep = "basic_info"
  } else if (!profile.avatar_url) {
    currentStep = "profile_picture"
  } else if (!profile.theme_preference || !profile.language) {
    currentStep = "preferences"
  } else if (profile.email_notifications === undefined || !profile.notification_preferences) {
    currentStep = "notifications"
  } else if (!profile.accessibility_settings) {
    currentStep = "accessibility"
  }

  // Calculate completion percentage
  completionPercentage = Math.round((completedSteps.length / 5) * 100)

  const is_complete = completionPercentage === 100

  return {
    completed_steps: completedSteps,
    current_step: currentStep,
    is_complete: is_complete,
    completion_percentage: completionPercentage,
  }
}
