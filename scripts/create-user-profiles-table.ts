import { getSupabaseAdmin } from "@/lib/supabase-client"

export async function createUserProfilesTable() {
  try {
    // Make sure we're on the server
    if (typeof window !== "undefined") {
      throw new Error("createUserProfilesTable must be called on the server")
    }

    const supabase = getSupabaseAdmin()

    // SQL to create the user_profiles table
    const sql = `
      -- Create user_profiles table if it doesn't exist
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

    // Execute the SQL
    const { error } = await supabase.rpc("pgcrypto_execute", { query: sql })

    if (error) {
      console.error("Error creating user_profiles table:", error)
      throw error
    }

    console.log("User profiles table created successfully")
    return true
  } catch (error) {
    console.error("Failed to create user_profiles table:", error)
    throw error
  }
}
