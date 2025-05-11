import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AnalyzeRLSAPI")

export async function GET() {
  try {
    logger.info("Analyzing RLS policies")

    // Use the server client
    const supabaseService = createServerClient()

    // Execute the SQL to analyze RLS policies
    const { data, error } = await supabaseService.rpc("exec_sql", {
      sql_query: `
        WITH policy_analysis AS (
          SELECT 
            schemaname, 
            tablename, 
            policyname,
            cmd,
            roles,
            qual,
            with_check,
            CASE 
              WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN true
              WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN true
              WHEN qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%' THEN true
              WHEN with_check LIKE '%current_setting(%' AND with_check NOT LIKE '%(SELECT current_setting(%' THEN true
              ELSE false
            END AS needs_optimization
          FROM 
            pg_policies
          WHERE 
            schemaname = 'public'
        )
        SELECT 
          json_build_object(
            'policies', (SELECT json_agg(policy_analysis.*) FROM policy_analysis),
            'total_policies', (SELECT COUNT(*) FROM policy_analysis),
            'policies_to_optimize', (SELECT COUNT(*) FROM policy_analysis WHERE needs_optimization),
            'tables_with_policies', (SELECT COUNT(DISTINCT tablename) FROM policy_analysis),
            'tables_needing_optimization', (SELECT COUNT(DISTINCT tablename) FROM policy_analysis WHERE needs_optimization)
          ) AS analysis_result;
      `,
    })

    if (error) {
      logger.error("Error analyzing RLS policies:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info("Successfully analyzed RLS policies")
    return NextResponse.json({
      success: true,
      data: data[0].analysis_result,
    })
  } catch (error) {
    logger.error("Unexpected error analyzing RLS policies:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
