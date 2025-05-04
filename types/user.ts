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
}

export interface SignUpCredentials {
  email: string
  password: string
  full_name?: string
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface PasswordUpdateData {
  current_password: string
  new_password: string
}
