import * as z from "zod"

export interface FullProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
  username?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  theme_preference?: "light" | "dark" | "system" | null
  email_notifications?: boolean
  notification_preferences?: {
    activity_updates?: boolean
    new_features?: boolean
    marketing?: boolean
  } | null
  timezone?: string | null
  language?: string
  accessibility_settings?: {
    high_contrast: boolean
    reduced_motion: boolean
    larger_text: boolean
  } | null
  completion_status?: ProfileCompletionStatus | null
}

export interface UserProfile {
  userId: string
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  email: string | null
  createdAt: string
  updatedAt: string
  bio: string | null
  location: string | null
  website: string | null
  preferences: UserPreferencesType
  completionStatus: ProfileCompletionStatus
}

export interface UserPreferencesType {
  themePreference: "light" | "dark" | "system"
  emailNotifications: boolean
  notificationPreferences: {
    activity_updates: boolean
    newFeatures: boolean
    marketing: boolean
  }
  language: string
  timezone: string | null
  accessibilitySettings: {
    highContrast: boolean
    reducedMotion: boolean
    largerText: boolean
  }
}

export interface ProfileCompletionStatus {
  is_complete: boolean
  completed_steps: string[]
  current_step: string
  percent_complete: number
}

export type ProfileUpdateData = Partial<
  Omit<FullProfile, "id" | "email" | "created_at" | "updated_at" | "completion_status">
>

export type PreferencesUpdateData = Partial<
  Pick<FullProfile, "theme_preference" | "email_notifications" | "notification_preferences" | "timezone" | "language">
>

export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  username: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  theme_preference: z.enum(["light", "dark", "system"]).nullable(),
  email_notifications: z.boolean(),
  notification_preferences: z
    .object({
      activity_updates: z.boolean(),
      new_features: z.boolean(),
      marketing: z.boolean(),
    })
    .nullable(),
  timezone: z.string().nullable(),
  language: z.string(),
  accessibility_settings: z
    .object({
      high_contrast: z.boolean(),
      reduced_motion: z.boolean(),
      larger_text: z.boolean(),
    })
    .nullable(),
  completion_status: z
    .object({
      is_complete: z.boolean(),
      completed_steps: z.array(z.string()),
      current_step: z.string(),
      percent_complete: z.number(),
    })
    .nullable(),
})

export const preferencesSchema = z.object({
  theme_preference: z.enum(["light", "dark", "system"]).optional().nullable(),
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

export const calculateProfileCompletion = (profile: FullProfile): ProfileCompletionStatus => {
  let completedSteps = 0
  const totalSteps = 3 // Example: Basic Info, Preferences, Avatar

  if (profile.full_name) completedSteps++
  if (profile.theme_preference) completedSteps++
  if (profile.avatar_url) completedSteps++

  const completionPercentage = (completedSteps / totalSteps) * 100
  const isComplete = completionPercentage === 100

  return {
    is_complete: isComplete,
    completed_steps: [], // Replace with actual steps
    current_step: "basic_info", // Replace with actual current step
    percent_complete: completionPercentage,
  }
}

export type Profile = z.infer<typeof profileSchema>
