/**
 * Database Permissions Checker
 * Utility to verify and diagnose database permission issues
 */
import { createAdminSupabaseClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBPermissions")

interface PermissionCheckResult {
  success: boolean
  missingPermissions: string[]
  details: Record<string, any>
}

/**
 * Checks if the database has the correct permissions configured
 * Helps diagnose DB-GRANT-001 errors
 */
export async function checkDatabasePermissions(): Promise<PermissionCheckResult> {
  try {
    // Use admin client to check permissions
    const supabase = await createAdminSupabaseClient()

    // Run the diagnostic query
    const { data, error } = await supabase.rpc("check_permissions")

    if (error) {
      logger.error("Error checking permissions:", error)
      return {
        success: false,
        missingPermissions: ["Unable to check permissions"],
        details: { error: error.message },
      }
    }

    // Process the results
    const missingPermissions: string[] = []

    if (data) {
      // Check for missing RLS policies
      if (!data.rls_enabled_on_all_tables) {
        missingPermissions.push("RLS not enabled on all tables")
      }

      // Check for missing role grants
      if (!data.authenticated_has_basic_permissions) {
        missingPermissions.push("Authenticated role missing basic permissions")
      }

      // Check for specific table permissions
      if (!data.profiles_policies_correct) {
        missingPermissions.push("Profiles table missing correct policies")
      }

      if (!data.categories_policies_correct) {
        missingPermissions.push("Categories table missing correct policies")
      }

      if (!data.goals_policies_correct) {
        missingPermissions.push("Goals table missing correct policies")
      }

      if (!data.entries_policies_correct) {
        missingPermissions.push("Entries table missing correct policies")
      }
    }

    return {
      success: missingPermissions.length === 0,
      missingPermissions,
      details: data || {},
    }
  } catch (error) {
    logger.error("Unexpected error checking permissions:", error)
    return {
      success: false,
      missingPermissions: ["Unexpected error checking permissions"],
      details: { error: String(error) },
    }
  }
}

/**
 * Creates the check_permissions database function if it doesn't exist
 * This should be run during application initialization
 */
export async function setupPermissionChecking(): Promise<boolean> {
  try {
    const supabase = await createAdminSupabaseClient()

    // Create the function to check permissions
    const { error } = await supabase.rpc("create_permission_checker")

    if (error) {
      // If the function already exists, that's fine
      if (error.message.includes("already exists")) {
        return true
      }

      logger.error("Error setting up permission checking:", error)
      return false
    }

    return true
  } catch (error) {
    logger.error("Unexpected error setting up permission checking:", error)
    return false
  }
}
