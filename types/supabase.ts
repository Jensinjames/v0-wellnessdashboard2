export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          auth_id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      wellness_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      wellness_activities: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          description: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          description?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      wellness_goals: {
        Row: {
          id: string
          user_id: string
          category_id: string
          activity_id: string | null
          target_minutes: number
          target_frequency: string | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          activity_id?: string | null
          target_minutes: number
          target_frequency?: string | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          activity_id?: string | null
          target_minutes?: number
          target_frequency?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wellness_entries: {
        Row: {
          id: string
          user_id: string
          category_id: string
          activity_id: string | null
          entry_date: string
          minutes_spent: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          activity_id?: string | null
          entry_date: string
          minutes_spent: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          activity_id?: string | null
          entry_date?: string
          minutes_spent?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wellness_metrics: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          motivation_level: number | null
          sleep_hours: number | null
          daily_score: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          motivation_level?: number | null
          sleep_hours?: number | null
          daily_score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          motivation_level?: number | null
          sleep_hours?: number | null
          daily_score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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

export type WellnessCategory = Database["public"]["Tables"]["wellness_categories"]["Row"]
export type WellnessActivity = Database["public"]["Tables"]["wellness_activities"]["Row"]
export type WellnessGoal = Database["public"]["Tables"]["wellness_goals"]["Row"]
export type WellnessEntry = Database["public"]["Tables"]["wellness_entries"]["Row"]
export type WellnessMetric = Database["public"]["Tables"]["wellness_metrics"]["Row"]
