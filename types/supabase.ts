import type { SupabaseClient, User, Session } from "@supabase/supabase-js"

// Edge function response type
export interface EdgeFunctionResponse<T = any> {
  data: T | null
  error: {
    message: string
    status?: number
  } | null
}

// Edge function context type
export interface EdgeFunctionContext {
  user: User | null
  session: Session | null
  supabaseClient: SupabaseClient<Database>
}

// Edge function handler type
export type EdgeFunctionHandler<T = any, P = any> = (
  req: Request,
  context: EdgeFunctionContext,
  params?: P,
) => Promise<EdgeFunctionResponse<T>>

// Client-side edge function caller type
export type EdgeFunctionCaller<T = any, P = any> = (
  params?: P,
  options?: {
    headers?: HeadersInit
    method?: "GET" | "POST" | "PUT" | "DELETE"
  },
) => Promise<EdgeFunctionResponse<T>>

// Auth state type
export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
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
          created_at: string
          user_id: string
          category: string
          duration: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          category: string
          duration: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          category?: string
          duration?: number
          notes?: string | null
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
      wellness_categories: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          color: string
          icon: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          color: string
          icon?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
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
      wellness_goals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          category_id: string
          target_duration: number
          timeframe: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          category_id: string
          target_duration: number
          timeframe: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          category_id?: string
          target_duration?: number
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_goals_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "wellness_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_goals_user_id_fkey"
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
