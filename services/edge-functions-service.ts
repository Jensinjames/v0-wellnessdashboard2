import { getSupabaseClient } from "@/lib/supabase"
import type { WeeklySummaryResponse, CategoryInsightResponse, EdgeFunctionError } from "@/types/edge-functions"

// Create a singleton instance of the Supabase client
const supabase = getSupabaseClient()

// Update the base URL to use the deployed Edge Functions URL
const getEdgeFunctionUrl = (functionName: string): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  }

  // Extract the project reference from the Supabase URL
  // Example: https://your-project-ref.supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1]

  if (!projectRef) {
    throw new Error("Could not extract project reference from Supabase URL")
  }

  return `https://${projectRef}.functions.supabase.co/${functionName}`
}

/**
 * Fetches weekly wellness summary with AI-generated insights
 */
export async function getWeeklyWellnessSummary(forceRefresh = false): Promise<WeeklySummaryResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("weekly-wellness-summary", {
      method: "POST",
      body: { forceRefresh },
    })

    if (error) throw new Error(error.message)

    return data as WeeklySummaryResponse
  } catch (error) {
    console.error("Error fetching weekly wellness summary:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets AI-generated insights for a specific wellness category
 */
export async function getCategoryInsights(category: string, forceRefresh = false): Promise<CategoryInsightResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("category-insights", {
      method: "POST",
      body: { category, forceRefresh },
    })

    if (error) throw new Error(error.message)

    return data as CategoryInsightResponse
  } catch (error) {
    console.error(`Error fetching insights for category ${category}:`, error)
    return {
      category,
      insights: "",
      recommendations: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Handles errors from edge functions
 */
export function handleEdgeFunctionError(error: unknown): EdgeFunctionError {
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
      details: error.stack,
    }
  }

  return {
    error: "Unknown error occurred",
    status: 500,
  }
}
