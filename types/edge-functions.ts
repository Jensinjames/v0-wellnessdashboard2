export interface WeeklySummaryResponse {
  data: {
    category: string
    total_duration: number
    entry_count: number
    week_start: string
    insights?: string
  }[]
  error: string | null
}

export interface CategoryInsightResponse {
  category: string
  insights: string
  recommendations: string[]
  error: string | null
}

export interface EdgeFunctionError {
  error: string
  status: number
  details?: string
}
