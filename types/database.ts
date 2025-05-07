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
      // Other tables...
    }
    // Other schema elements...
  }
}
