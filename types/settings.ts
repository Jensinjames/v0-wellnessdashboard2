export type NotificationFrequency = "all" | "important" | "none"
export type MeasurementUnit = "metric" | "imperial"
export type DataSharing = "all" | "anonymous" | "none"

export interface UserSettings {
  // Notification settings
  emailNotifications: boolean
  pushNotifications: boolean
  notificationFrequency: NotificationFrequency

  // Data & Privacy settings
  dataSharing: DataSharing
  measurementUnit: MeasurementUnit

  // Account settings
  name: string
  email: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string

  // Appearance settings
  compactView: boolean
}
