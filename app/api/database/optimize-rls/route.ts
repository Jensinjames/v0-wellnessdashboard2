import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("OptimizeRLSAPI")

export async function POST() {
  try {
    logger.info("Starting RLS policy optimization")

    // Use the server client
    const supabaseService = createServerClient()

    // Execute the SQL to optimize RLS policies
    const { data, error } = await supabaseService.rpc("exec_sql", {
      sql_query: `
        DO $$
        DECLARE
          policy_record RECORD;
          policy_count INT := 0;
          optimized_count INT := 0;
        BEGIN
          -- Loop through all RLS policies that might need optimization
          FOR policy_record IN
            SELECT 
              schemaname, 
              tablename, 
              policyname,
              qual,
              with_check,
              cmd
            FROM 
              pg_policies
            WHERE 
              schemaname = 'public' AND
              (qual LIKE '%auth.uid()%' OR 
               with_check LIKE '%auth.uid()%' OR
               qual LIKE '%current_setting(%' OR
               with_check LIKE '%current_setting(%')
          LOOP
            policy_count := policy_count + 1;
            
            -- Check if policy needs optimization
            IF (policy_record.qual LIKE '%auth.uid()%' AND policy_record.qual NOT LIKE '%(SELECT auth.uid())%') OR
               (policy_record.with_check LIKE '%auth.uid()%' AND policy_record.with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (policy_record.qual LIKE '%current_setting(%' AND policy_record.qual NOT LIKE '%(SELECT current_setting(%') OR
               (policy_record.with_check LIKE '%current_setting(%' AND policy_record.with_check NOT LIKE '%(SELECT current_setting(%') THEN
              
              -- Get the policy definition
              DECLARE
                policy_def TEXT;
                new_qual TEXT := policy_record.qual;
                new_with_check TEXT := policy_record.with_check;
              BEGIN
                -- Optimize USING clause
                IF policy_record.qual IS NOT NULL THEN
                  -- Replace auth.uid() with (SELECT auth.uid())
                  IF policy_record.qual LIKE '%auth.uid()%' AND policy_record.qual NOT LIKE '%(SELECT auth.uid())%' THEN
                    new_qual := replace(policy_record.qual, 'auth.uid()', '(SELECT auth.uid())');
                  END IF;
                  
                  -- Replace current_setting() with (SELECT current_setting())
                  IF policy_record.qual LIKE '%current_setting(%' AND policy_record.qual NOT LIKE '%(SELECT current_setting(%' THEN
                    new_qual := regexp_replace(policy_record.qual, 'current_setting\$$([^)]+)\$$', '(SELECT current_setting($1))', 'g');
                  END IF;
                END IF;
                
                -- Optimize WITH CHECK clause
                IF policy_record.with_check IS NOT NULL THEN
                  -- Replace auth.uid() with (SELECT auth.uid())
                  IF policy_record.with_check LIKE '%auth.uid()%' AND policy_record.with_check NOT LIKE '%(SELECT auth.uid())%' THEN
                    new_with_check := replace(policy_record.with_check, 'auth.uid()', '(SELECT auth.uid())');
                  END IF;
                  
                  -- Replace current_setting() with (SELECT current_setting())
                  IF policy_record.with_check LIKE '%current_setting(%' AND policy_record.with_check NOT LIKE '%(SELECT current_setting(%' THEN
                    new_with_check := regexp_replace(policy_record.with_check, 'current_setting\$$([^)]+)\$$', '(SELECT current_setting($1))', 'g');
                  END IF;
                END IF;
                
                -- Drop and recreate the policy with optimized expressions
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                              policy_record.policyname, 
                              policy_record.schemaname, 
                              policy_record.tablename);
                
                -- Recreate the policy with optimized expressions
                IF policy_record.with_check IS NOT NULL THEN
                  EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s USING (%s) WITH CHECK (%s)', 
                                policy_record.policyname, 
                                policy_record.schemaname, 
                                policy_record.tablename,
                                policy_record.cmd,
                                new_qual,
                                new_with_check);
                ELSE
                  EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s USING (%s)', 
                                policy_record.policyname, 
                                policy_record.schemaname, 
                                policy_record.tablename,
                                policy_record.cmd,
                                new_qual);
                END IF;
                
                optimized_count := optimized_count + 1;
                RAISE NOTICE 'Optimized policy % on table %.%', 
                  policy_record.policyname, policy_record.schemaname, policy_record.tablename;
              EXCEPTION
                WHEN OTHERS THEN
                  -- If we can't optimize the policy, log it and continue
                  RAISE NOTICE 'Could not optimize policy % on table %.%: %', 
                    policy_record.policyname, policy_record.schemaname, policy_record.tablename, SQLERRM;
              END;
            END IF;
          END LOOP;
          
          -- Return summary
          RAISE NOTICE 'RLS Policy Optimization Summary: % policies found, % optimized', policy_count, optimized_count;
        END
        $$;
      `,
    })

    if (error) {
      logger.error("Error optimizing RLS policies:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info("Successfully optimized RLS policies")
    return NextResponse.json({
      success: true,
      message: "Successfully optimized RLS policies",
    })
  } catch (error) {
    logger.error("Unexpected error optimizing RLS policies:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
