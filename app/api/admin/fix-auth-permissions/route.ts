import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("FixAuthPermissions")

// SQL script to fix auth permissions
const FIX_AUTH_PERMISSIONS_SQL = `
-- Fix Database Permissions for Authentication
-- This script addresses the DB-CONFIG-001 and DB-GRANT-001 errors

-- 1. Create the health_check table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.health_check (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ok',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Grant permissions on the health_check table
GRANT SELECT, INSERT ON public.health_check TO anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.health_check_id_seq TO anon, authenticated, service_role;

-- 3. Ensure the auth.users table has the correct permissions
GRANT SELECT ON auth.users TO service_role;
GRANT SELECT ON auth.users TO authenticated;

-- 4. Ensure profiles table has correct permissions and RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Enable RLS on profiles
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies if they don't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can view their own profile'
    ) THEN
      CREATE POLICY "Users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can update their own profile'
    ) THEN
      CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can insert their own profile'
    ) THEN
      CREATE POLICY "Users can insert their own profile" 
        ON public.profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
    GRANT ALL ON public.profiles TO service_role;
  END IF;
END $$;

-- 5. Fix any missing grants for the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- 6. Create a function to verify database permissions are working
CREATE OR REPLACE FUNCTION public.check_auth_permissions()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result = jsonb_build_object(
    'timestamp', now(),
    'auth_schema_exists', EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'),
    'profiles_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles'),
    'health_check_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_check'),
    'profiles_has_rls', EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION public.check_auth_permissions() TO authenticated, anon, service_role;
`

export async function POST() {
  try {
    // Create a Supabase client using the service role key for admin operations
    const cookieStore = cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Execute the SQL script
    const { error } = await supabase.rpc("exec_sql", { sql: FIX_AUTH_PERMISSIONS_SQL })

    if (error) {
      logger.error("Error executing SQL script:", error)

      // Try a different approach - execute individual statements
      const statements = FIX_AUTH_PERMISSIONS_SQL.split(";")
      const results = []

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc("exec_sql", { sql: statement + ";" })
          results.push({
            statement: statement.substring(0, 50) + "...",
            success: !stmtError,
            error: stmtError?.message,
          })

          if (stmtError) {
            logger.warn(`Error executing statement: ${statement.substring(0, 100)}...`, stmtError)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Permissions partially fixed with some errors",
        results,
      })
    }

    // Check if the fixes worked
    const { data: checkData, error: checkError } = await supabase.rpc("check_auth_permissions")

    return NextResponse.json({
      success: true,
      message: "Database permissions fixed successfully",
      check: checkError ? null : checkData,
    })
  } catch (error: any) {
    logger.error("Error fixing auth permissions:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
