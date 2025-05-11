export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          display_name: string | null
          email: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          display_name?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          display_name?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
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
      user_preferences: {
        Row: {
          user_id: string
          notification_settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          notification_settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          notification_settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pg_policies: {
        Row: {
          schemaname: string | null
          tablename: string | null
          policyname: string | null
          cmd: string | null
          roles: string[] | null
          qual: string | null
          with_check: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      exec_sql: {
        Args: {
          sql_query: string
        }
        Returns: Json
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
