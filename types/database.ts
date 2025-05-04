export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          username: string | null
          bio: string | null
          location: string | null
          website: string | null
          theme_preference: string | null
          email_notifications: boolean
          notification_preferences: Json | null
          timezone: string
          language: string
        }
        Insert: {
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
          notification_preferences?: Json | null
          timezone?: string
          language?: string
        }
        Update: {
          id?: string
          email?: string
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
          notification_preferences?: Json | null
          timezone?: string
          language?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
