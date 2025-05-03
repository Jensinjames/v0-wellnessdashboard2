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

// Database types (placeholder - you'll need to generate these from your actual schema)
export interface Database {
  public: {
    Tables: {
      // Define your tables here
      profiles: {
        Row: {
          id: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
        }
        Insert: {
          id: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
        }
      }
      // Add other tables as needed
    }
    Functions: {
      // Define your functions here
    }
    Enums: {
      // Define your enums here
    }
  }
}
