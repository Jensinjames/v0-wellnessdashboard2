import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("RLSAnalyzer")

export interface RLSPolicy {
  schemaname: string
  tablename: string
  policyname: string
  cmd: string
  roles: string[]
  qual: string
  with_check: string | null
  needs_optimization: boolean
}

export interface RLSAnalysisResult {
  success: boolean
  policies: RLSPolicy[]
  totalPolicies: number
  policiesToOptimize: number
  error?: string
}

/**
 * Analyze RLS policies to identify optimization opportunities
 */
export async function analyzeRLSPolicies(): Promise<RLSAnalysisResult> {
  try {
    const supabase = createServerClient()

    // Get all RLS policies using exec_sql
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT 
          schemaname, 
          tablename, 
          policyname,
          cmd,
          roles,
          qual,
          with_check
        FROM 
          pg_policies
        WHERE 
          schemaname = 'public';
      `,
    })

    if (error) {
      logger.error("Error fetching RLS policies:", error)
      return {
        success: false,
        policies: [],
        totalPolicies: 0,
        policiesToOptimize: 0,
        error: error.message,
      }
    }

    // Analyze each policy
    const policies: RLSPolicy[] = data.map((policy) => {
      const needsOptimization =
        (policy.qual?.includes("auth.uid()") && !policy.qual?.includes("(SELECT auth.uid())")) ||
        (policy.with_check?.includes("auth.uid()") && !policy.with_check?.includes("(SELECT auth.uid())")) ||
        (policy.qual?.includes("current_setting(") && !policy.qual?.includes("(SELECT current_setting(")) ||
        (policy.with_check?.includes("current_setting(") && !policy.with_check?.includes("(SELECT current_setting("))

      return {
        ...policy,
        needs_optimization: needsOptimization,
      }
    })

    const policiesToOptimize = policies.filter((policy) => policy.needs_optimization).length

    return {
      success: true,
      policies,
      totalPolicies: policies.length,
      policiesToOptimize,
    }
  } catch (error) {
    logger.error("Error analyzing RLS policies:", error)
    return {
      success: false,
      policies: [],
      totalPolicies: 0,
      policiesToOptimize: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Optimize RLS policies
 */
export async function optimizeRLSPolicies(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Call the API to optimize RLS policies
    const response = await fetch("/api/database/optimize-rls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        message: data.error || "Failed to optimize RLS policies",
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: data.message || "Successfully optimized RLS policies",
    }
  } catch (error) {
    logger.error("Error optimizing RLS policies:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
