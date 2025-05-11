/**
 * Database Types
 * TypeScript definitions for Supabase database schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          email_verified: boolean
          phone: string | null
          phone_verified: boolean
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          target_value: number | null
          current_value: number | null
          category_id: string | null
          user_id: string
          created_at: string
          updated_at: string
          deadline: string | null
          status: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          category_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          deadline?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          category_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          deadline?: string | null
          status?: string | null
        }
      }
      entries: {
        Row: {
          id: string
          value: number
          notes: string | null
          category_id: string | null
          goal_id: string | null
          user_id: string
          created_at: string
          updated_at: string
          entry_date: string
        }
        Insert: {
          id?: string
          value: number
          notes?: string | null
          category_id?: string | null
          goal_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          entry_date?: string
        }
        Update: {
          id?: string
          value?: number
          notes?: string | null
          category_id?: string | null
          goal_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          entry_date?: string
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

// Helper types for common database operations
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// Profile type
export type Profile = Tables<"profiles">
export type InsertProfile = InsertTables<"profiles">
export type UpdateProfile = UpdateTables<"profiles">

// Category type
export type Category = Tables<"categories">
export type InsertCategory = InsertTables<"categories">
export type UpdateCategory = UpdateTables<"categories">

// Goal type
export type Goal = Tables<"goals">
export type InsertGoal = InsertTables<"goals">
export type UpdateGoal = UpdateTables<"goals">

// Entry type
export type Entry = Tables<"entries">
export type InsertEntry = InsertTables<"entries">
export type UpdateEntry = UpdateTables<"entries">
