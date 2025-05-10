/**
 * Admin API to check database permissions
 * Helps diagnose DB-GRANT-001 errors
 */
import { NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/utils/auth-utils"
import { createLogger } from "@/utils/logger"

const logger = createLogger("CheckPermissions")

export async function GET(request: Request) {
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

    // Check if the permission checker function exists
    const { data: functionExists, error: functionCheckError } = await adminClient
      .from("pg_proc")
      .select("proname")
      .eq("proname", "check_permissions")
      .limit(1)

    if (functionCheckError) {
      logger.error("Error checking if function exists:", functionCheckError)
    }

    // If the function doesn't exist, create it
    if (!functionExists || functionExists.length === 0) {
      logger.info("Creating permission checker function")

      const createFunctionSQL = `
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

      const { error: createError } = await adminClient.sql(createFunctionSQL)

      if (createError) {
        logger.error("Error creating permission checker function:", createError)
        return NextResponse.json(
          {
            error: "Failed to create permission checker function",
            details: createError.message,
          },
          { status: 500 },
        )
      }
    }

    // Check permissions
    logger.info("Checking database permissions")
    const { data: permissionData, error: permissionError } = await adminClient.rpc("check_permissions")

    if (permissionError) {
      logger.error("Error checking permissions:", permissionError)
      return NextResponse.json(
        {
          error: "Failed to check permissions",
          details: permissionError.message,
        },
        { status: 500 },
      )
    }

    // Process the results
    const missingPermissions: string[] = []

    if (permissionData) {
      // Check for missing RLS policies
      if (!permissionData.rls_enabled_on_all_tables) {
        missingPermissions.push("RLS not enabled on all tables")
      }

      // Check for missing role grants
      if (!permissionData.authenticated_has_basic_permissions) {
        missingPermissions.push("Authenticated role missing basic permissions")
      }

      // Check for specific table permissions
      if (!permissionData.profiles_policies_correct) {
        missingPermissions.push("Profiles table missing correct policies")
      }

      if (!permissionData.categories_policies_correct) {
        missingPermissions.push("Categories table missing correct policies")
      }

      if (!permissionData.goals_policies_correct) {
        missingPermissions.push("Goals table missing correct policies")
      }

      if (!permissionData.entries_policies_correct) {
        missingPermissions.push("Entries table missing correct policies")
      }
    }

    return NextResponse.json({
      success: missingPermissions.length === 0,
      missingPermissions,
      details: permissionData || {},
    })
  } catch (error) {
    logger.error("Unexpected error checking permissions:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
