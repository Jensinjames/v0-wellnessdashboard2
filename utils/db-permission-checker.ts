import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBPermissionChecker")

/**
 * Check if the user_changes_log table exists
 * This table is often referenced in RLS policies and can cause grant errors if missing
 */
export async function checkUserChangesLogTable(): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // Check if the table exists using raw SQL query instead of the ORM
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_changes_log'
        ) as exists;
      `,
    })

    if (error) {
      logger.error("Error checking user_changes_log table:", error)
      return false
    }

    return data?.[0]?.exists || false
  } catch (error) {
    logger.error("Unexpected error checking user_changes_log table:", error)
    return false
  }
}

/**
 * Create the user_changes_log table if it doesn't exist
 * This can help resolve database grant errors
 */
export async function createUserChangesLogTable(): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // Create the table with proper RLS policies
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.user_changes_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_address TEXT,
          old_values JSONB,
          new_values JSONB
        );
        
        ALTER TABLE public.user_changes_log ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_changes_log;
        CREATE POLICY "Users can view their own logs"
          ON public.user_changes_log
          FOR SELECT
          USING ((SELECT auth.uid()) = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_changes_log;
        CREATE POLICY "Users can insert their own logs"
          ON public.user_changes_log
          FOR INSERT
          WITH CHECK ((SELECT auth.uid()) = user_id);
        
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT SELECT, INSERT ON public.user_changes_log TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
      `,
    })

    if (error) {
      logger.error("Error creating user_changes_log table:", error)
      return false
    }

    return true
  } catch (error) {
    logger.error("Unexpected error creating user_changes_log table:", error)
    return false
  }
}

/**
 * Check and fix database permissions
 * This can help resolve database grant errors
 */
export async function checkAndFixDatabasePermissions(): Promise<boolean> {
  try {
    // Check if the table exists
    const tableExists = await checkUserChangesLogTable()

    if (!tableExists) {
      // Create the table
      const created = await createUserChangesLogTable()

      if (!created) {
        logger.error("Failed to create user_changes_log table")
        return false
      }

      logger.info("Created user_changes_log table")
    }

    // Fix general permissions
    const supabase = createServerClient()

    // Grant general permissions to authenticated users
    const { error: permissionsError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Grant basic permissions to authenticated users
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        
        -- Ensure auth functions are accessible
        GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
        GRANT EXECUTE ON FUNCTION auth.role() TO authenticated;
        
        -- Fix common RLS issues by ensuring policies use subqueries
        DO $$
        DECLARE
          policy_record RECORD;
        BEGIN
          FOR policy_record IN
            SELECT 
              schemaname, 
              tablename, 
              policyname
            FROM 
              pg_policies
            WHERE 
              schemaname = 'public' AND
              (qual LIKE '%auth.uid()%' OR 
               with_check LIKE '%auth.uid()%')
          LOOP
            -- Get the policy definition
            EXECUTE format('SELECT pg_get_policydef(oid) FROM pg_policy WHERE policyname = %L AND tablename = %L', 
                          policy_record.policyname, policy_record.tablename) INTO policy_record.definition;
            
            -- If the policy uses auth.uid() directly (not in a subquery)
            IF policy_record.definition LIKE '%auth.uid() =%' OR 
               policy_record.definition LIKE '%= auth.uid()%' THEN
              
              -- Drop and recreate the policy with a subquery
              EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                            policy_record.policyname, 
                            policy_record.schemaname, 
                            policy_record.tablename);
              
              -- Extract the column name that's compared with auth.uid()
              DECLARE
                column_name TEXT;
                policy_using TEXT;
                policy_with_check TEXT;
                policy_cmd TEXT;
              BEGIN
                -- Extract policy components
                policy_cmd := substring(policy_record.definition FROM 'TO public FOR ([A-Z]+)');
                policy_using := substring(policy_record.definition FROM 'USING \$$(.+?)\$$( WITH CHECK)?');
                policy_with_check := substring(policy_record.definition FROM 'WITH CHECK \$$(.+?)\$$');
                
                -- Create new policy with subquery
                IF policy_using IS NOT NULL THEN
                  policy_using := replace(policy_using, 'auth.uid()', '(SELECT auth.uid())');
                END IF;
                
                IF policy_with_check IS NOT NULL THEN
                  policy_with_check := replace(policy_with_check, 'auth.uid()', '(SELECT auth.uid())');
                END IF;
                
                -- Recreate the policy
                EXECUTE format(
                  'CREATE POLICY %I ON %I.%I FOR %s USING (%s) %s', 
                  policy_record.policyname, 
                  policy_record.schemaname, 
                  policy_record.tablename,
                  policy_cmd,
                  policy_using,
                  CASE WHEN policy_with_check IS NOT NULL THEN 'WITH CHECK (' || policy_with_check || ')' ELSE '' END
                );
              EXCEPTION
                WHEN OTHERS THEN
                  RAISE NOTICE 'Could not fix policy %: %', policy_record.policyname, SQLERRM;
              END;
            END IF;
          END LOOP;
        END
        $$;
      `,
    })

    if (permissionsError) {
      logger.error("Error fixing general permissions:", permissionsError)
      return false
    }

    return true
  } catch (error) {
    logger.error("Unexpected error checking and fixing database permissions:", error)
    return false
  }
}
