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
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_entries: {
        Row: {
          id: string
          user_id: string
          category: string
          activity: string
          duration: number
          notes: string | null
          timestamp: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          activity: string
          duration: number
          notes?: string | null
          timestamp?: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          activity?: string
          duration?: number
          notes?: string | null
          timestamp?: string
          created_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_goals: {
        Row: {
          id: string
          user_id: string
          category: string
          goal_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          goal_hours: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          goal_hours?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_goals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_weekly_wellness_summary: {
        Args: {
          user_uuid: string
        }
        Returns: {
          category: string
          total_duration: number
          entry_count: number
          week_start: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
