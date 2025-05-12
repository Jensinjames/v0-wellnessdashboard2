export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          location: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string | null
          description: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          icon?: string | null
          description?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon?: string | null
          description?: string | null
          user_id?: string
          created_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          category_id: string
          user_id: string
          date: string
          duration: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          user_id: string
          date: string
          duration: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          user_id?: string
          date?: string
          duration?: number
          notes?: string | null
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          category_id: string
          user_id: string
          target_duration: number
          timeframe: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          user_id: string
          target_duration: number
          timeframe: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          user_id?: string
          target_duration?: number
          timeframe?: string
          start_date?: string
          end_date?: string
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
