import * as z from "zod"
import { createTextSchema, createEmailSchema, createBooleanSchema } from "@/utils/zod-schemas"

// Schema for theme preference
export const themeSchema = z.enum(["light", "dark", "system"], {
  invalid_type_error: "Please select a valid theme",
  required_error: "Theme is required",
})

// Schema for distance unit preference
export const distanceUnitSchema = z.enum(["km", "mi"], {
  invalid_type_error: "Please select a valid distance unit",
  required_error: "Distance unit is required",
})

// Schema for weight unit preference
export const weightUnitSchema = z.enum(["kg", "lb"], {
  invalid_type_error: "Please select a valid weight unit",
  required_error: "Weight unit is required",
})

// Schema for temperature unit preference
export const temperatureUnitSchema = z.enum(["c", "f"], {
  invalid_type_error: "Please select a valid temperature unit",
  required_error: "Temperature unit is required",
})

// Schema for notification settings
export const notificationSettingsSchema = z.object({
  email: createBooleanSchema({ name: "Email notifications" }),
  push: createBooleanSchema({ name: "Push notifications" }),
  reminders: createBooleanSchema({ name: "Reminders" }),
})

// Schema for privacy settings
export const privacySettingsSchema = z.object({
  shareData: createBooleanSchema({ name: "Share data" }),
  anonymizeData: createBooleanSchema({ name: "Anonymize data" }),
})

// Schema for unit preferences
export const unitPreferencesSchema = z.object({
  distance: distanceUnitSchema,
  weight: weightUnitSchema,
  temperature: temperatureUnitSchema,
})

// Schema for user settings form
export const userSettingsFormSchema = z.object({
  displayName: createTextSchema({
    name: "Display name",
    min: 2,
    max: 50,
  }),
  email: createEmailSchema(),
  theme: themeSchema,
  notifications: notificationSettingsSchema,
  privacySettings: privacySettingsSchema,
  unitPreferences: unitPreferencesSchema,
})

// Type inference
export type UserSettingsFormValues = z.infer<typeof userSettingsFormSchema>
