"use server"

import { getSupabaseAdmin } from "@/lib/supabase-client"
import { revalidatePath } from "next/cache"

interface CreateProfileParams {
  auth_id: string
  email: string
  display_name?: string | null
}

interface CheckProfileParams {
  auth_id: string
  email: string
}

export async function createUserProfile(params: CreateProfileParams) {
  try {
    const { auth_id, email, display_name } = params

    if (!auth_id || !email) {
      return {
        success: false,
        message: "Missing required fields",
      }
    }

    // Get admin client
    const supabase = getSupabaseAdmin()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", auth_id)
      .maybeSingle()

    if (existingProfile) {
      return {
        success: true,
        message: "Profile already exists",
        profile: existingProfile,
      }
    }

    // Create new profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert([
        {
          auth_id,
          email,
          display_name: display_name || email.split("@")[0],
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return {
        success: false,
        message: "Failed to create profile",
        error: error.message,
      }
    }

    revalidatePath("/admin/users")

    return {
      success: true,
      message: "Profile created successfully",
      profile: data,
    }
  } catch (error) {
    console.error("Server error creating profile:", error)
    return {
      success: false,
      message: "Server error creating profile",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function checkUserProfile(params: CheckProfileParams) {
  try {
    const { auth_id, email } = params

    if (!auth_id || !email) {
      return {
        success: false,
        message: "Missing required fields",
      }
    }

    // Get admin client
    const supabase = getSupabaseAdmin()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", auth_id)
      .maybeSingle()

    if (existingProfile) {
      return {
        success: true,
        message: "Profile exists",
        profile: existingProfile,
      }
    }

    // Create new profile if it doesn't exist
    const { data, error } = await supabase
      .from("user_profiles")
      .insert([
        {
          auth_id,
          email,
          display_name: email.split("@")[0],
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return {
        success: false,
        message: "Failed to create profile",
        error: error.message,
      }
    }

    revalidatePath("/admin/users")

    return {
      success: true,
      message: "Profile created successfully",
      profile: data,
    }
  } catch (error) {
    console.error("Server error checking/creating profile:", error)
    return {
      success: false,
      message: "Server error checking/creating profile",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function executeSQL(sql: string) {
  try {
    // Make sure we're on the server
    if (typeof window !== "undefined") {
      throw new Error("executeSQL must be called on the server")
    }

    const supabase = getSupabaseAdmin()

    // Execute the SQL
    const { error } = await supabase.rpc("pgcrypto_execute", { query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      throw error
    }

    return {
      success: true,
      message: "SQL executed successfully",
    }
  } catch (error) {
    console.error("Failed to execute SQL:", error)
    return {
      success: false,
      message: "Failed to execute SQL",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function setupUserProfilesTable() {
  try {
    // Read the SQL file content
    const sql = `
    -- Create user_profiles table
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      auth_id UUID NOT NULL UNIQUE,
      email TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      preferences JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index on auth_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);
    
    -- Set up RLS (Row Level Security)
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies (drop first to avoid errors if they already exist)
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
    
    CREATE POLICY "Users can view their own profile" 
      ON public.user_profiles 
      FOR SELECT 
      USING (auth.uid()::text = auth_id::text);
    
    CREATE POLICY "Users can update their own profile" 
      ON public.user_profiles 
      FOR UPDATE 
      USING (auth.uid()::text = auth_id::text);
    
    CREATE POLICY "Users can insert their own profile" 
      ON public.user_profiles 
      FOR INSERT 
      WITH CHECK (auth.uid()::text = auth_id::text);
    
    CREATE POLICY "Service role can manage all profiles" 
      ON public.user_profiles 
      USING (auth.role() = 'service_role');
    `

    return await executeSQL(sql)
  } catch (error) {
    console.error("Failed to setup user_profiles table:", error)
    return {
      success: false,
      message: "Failed to setup user_profiles table",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
