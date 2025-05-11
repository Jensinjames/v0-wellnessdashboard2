/**
 * Admin API to fix database permissions
 * Addresses DB-GRANT-001 errors
 */
import { NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/utils/auth-utils"
import { createLogger } from "@/utils/logger"

const logger = createLogger("FixPermissions")

// SQL to create the permission checker function
const CREATE_PERMISSION_CHECKER_SQL = `
CREATE OR REPLACE FUNCTION public.check_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Initialize result
  result = jsonb_build_object(
    'rls_enabled_on_all_tables', true,
    'authenticated_has_basic_permissions', true,
    'profiles_policies_correct', true,
    'categories_policies_correct', true,
    'goals_policies_correct', true,
    'entries_policies_correct', true
  );
  
  -- Check if RLS is enabled on all tables
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'categories', 'goals', 'entries')
    AND NOT row_security_active(tablename)
  ) THEN
    result = jsonb_set(result, '{rls_enabled_on_all_tables}', 'false');
  END IF;
  
  -- Check if authenticated role has basic permissions
  IF NOT (
    has_schema_privilege('authenticated', 'public', 'USAGE') AND
    has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  ) THEN
    result = jsonb_set(result, '{authenticated_has_basic_permissions}', 'false');
  END IF;
  
  -- Check profiles policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Users can view their own profile'
  ) THEN
    result = jsonb_set(result, '{profiles_policies_correct}', 'false');
  END IF;
  
  -- Check categories policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories'
    AND policyname = 'Users can view their own categories'
  ) THEN
    result = jsonb_set(result, '{categories_policies_correct}', 'false');
  END IF;
  
  -- Check goals policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goals'
    AND policyname = 'Users can view their own goals'
  ) THEN
    result = jsonb_set(result, '{goals_policies_correct}', 'false');
  END IF;
  
  -- Check entries policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'entries'
    AND policyname = 'Users can view their own entries'
  ) THEN
    result = jsonb_set(result, '{entries_policies_correct}', 'false');
  END IF;
  
  RETURN result;
END;
$$;
`

// SQL to fix permissions
const FIX_PERMISSIONS_SQL = `
-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create RLS policies for categories table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can view their own categories') THEN
    CREATE POLICY "Users can view their own categories"
      ON public.categories
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can create their own categories') THEN
    CREATE POLICY "Users can create their own categories"
      ON public.categories
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can update their own categories') THEN
    CREATE POLICY "Users can update their own categories"
      ON public.categories
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Users can delete their own categories') THEN
    CREATE POLICY "Users can delete their own categories"
      ON public.categories
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create RLS policies for goals table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goals' AND policyname = 'Users can view their own goals') THEN
    CREATE POLICY "Users can view their own goals"
      ON public.goals
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goals' AND policyname = 'Users can create their own goals') THEN
    CREATE POLICY "Users can create their own goals"
      ON public.goals
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goals' AND policyname = 'Users can update their own goals') THEN
    CREATE POLICY "Users can update their own goals"
      ON public.goals
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goals' AND policyname = 'Users can delete their own goals') THEN
    CREATE POLICY "Users can delete their own goals"
      ON public.goals
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create RLS policies for entries table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'Users can view their own entries') THEN
    CREATE POLICY "Users can view their own entries"
      ON public.entries
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'Users can create their own entries') THEN
    CREATE POLICY "Users can create their own entries"
      ON public.entries
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'Users can update their own entries') THEN
    CREATE POLICY "Users can update their own entries"
      ON public.entries
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'Users can delete their own entries') THEN
    CREATE POLICY "Users can delete their own entries"
      ON public.entries
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Grant appropriate permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles, public.categories, public.goals, public.entries TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
`

export async function POST(request: Request) {
  try {
    // First, verify the user is authenticated and has admin role
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const isAdmin = await isUserAdmin(session.user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Now that we've verified admin status, use the admin client for privileged operations
    const adminClient = await createAdminSupabaseClient()

    // Create the permission checker function
    logger.info("Creating permission checker function")
    const { error: createFunctionError } = await adminClient.rpc("create_permission_checker")

    if (createFunctionError && !createFunctionError.message.includes("already exists")) {
      logger.error("Error creating permission checker function:", createFunctionError)

      // Try direct SQL execution
      const { error: sqlError } = await adminClient.sql(CREATE_PERMISSION_CHECKER_SQL)

      if (sqlError) {
        logger.error("Error creating permission checker with direct SQL:", sqlError)
        return NextResponse.json(
          {
            error: "Failed to create permission checker function",
            details: sqlError.message,
          },
          { status: 500 },
        )
      }
    }

    // Check current permissions
    logger.info("Checking current permissions")
    const { data: beforeCheck, error: checkError } = await adminClient.rpc("check_permissions")

    if (checkError) {
      logger.error("Error checking permissions:", checkError)
      return NextResponse.json(
        {
          error: "Failed to check current permissions",
          details: checkError.message,
        },
        { status: 500 },
      )
    }

    // Apply permission fixes
    logger.info("Applying permission fixes")
    const { error: fixError } = await adminClient.sql(FIX_PERMISSIONS_SQL)

    if (fixError) {
      logger.error("Error fixing permissions:", fixError)
      return NextResponse.json(
        {
          error: "Failed to apply permission fixes",
          details: fixError.message,
        },
        { status: 500 },
      )
    }

    // Check permissions after fixes
    logger.info("Checking permissions after fixes")
    const { data: afterCheck, error: afterCheckError } = await adminClient.rpc("check_permissions")

    if (afterCheckError) {
      logger.error("Error checking permissions after fixes:", afterCheckError)
      return NextResponse.json(
        {
          error: "Failed to verify permission fixes",
          details: afterCheckError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      before: beforeCheck,
      after: afterCheck,
      message: "Database permissions have been fixed successfully",
    })
  } catch (error) {
    logger.error("Unexpected error fixing permissions:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
