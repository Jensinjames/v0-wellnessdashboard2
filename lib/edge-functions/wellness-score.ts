/**
 * Client-side utility for calling the wellness-score Edge Function
 */
import { callEdgeFunction } from "@/lib/edge-function-config"

export interface WellnessMetrics {
  sleep: number // hours of sleep
  exercise: number // minutes of exercise
  meditation?: number // minutes of meditation (optional)
  water: number // glasses of water
  nutrition: number // 1-10 rating of nutrition quality
  stress: number // 1-10 stress level (10 being highest stress)
  mood: number // 1-10 mood rating (10 being best mood)
  userId?: string // optional user ID for personalization
  category?: string // optional category focus (e.g., "sleep", "exercise")
}

export interface WellnessScoreResponse {
  score: {
    overall_score: number
    sleep_score: number
    exercise_score: number
    nutrition_score: number
    stress_score: number
  }
  category_scores: {
    sleep: number
    exercise: number
    nutrition: number
    stress: number
    overall: number
  }
  recommendations: Array<{
    category: string
    priority: "low" | "medium" | "high"
    message: string
  }>
  timestamp: string
}

/**
 * Calculate wellness score using the Edge Function
 */
export async function calculateWellnessScore(metrics: WellnessMetrics): Promise<WellnessScoreResponse> {
  try {
    return await callEdgeFunction<WellnessScoreResponse>("wellness-score", "POST", { metrics })
  } catch (error) {
    console.error("Error calculating wellness score:", error)
    throw new Error(`Failed to calculate wellness score: ${error.message}`)
  }
}

/**
 * Calculate wellness score with fallback to client-side calculation if Edge Function is unavailable
 */
export async function calculateWellnessScoreWithFallback(metrics: WellnessMetrics): Promise<WellnessScoreResponse> {
  try {
    // Try to use the Edge Function first
    return await calculateWellnessScore(metrics)
  } catch (error) {
    console.warn("Edge Function unavailable, using client-side fallback:", error)

    // Implement a simplified version of the score calculation for fallback
    // This should be kept in sync with the Edge Function logic
    const sleepScore = Math.min(100, (metrics.sleep / 8) * 100)
    const exerciseScore = Math.min(100, (metrics.exercise / 30) * 100)
    const nutritionScore = metrics.nutrition * 10
    const stressScore = (10 - metrics.stress) * 10

    const overallScore = Math.round(
      sleepScore * 0.25 + exerciseScore * 0.2 + nutritionScore * 0.2 + stressScore * 0.2 + metrics.mood * 10 * 0.15,
    )

    // Return a simplified response
    return {
      score: {
        overall_score: overallScore,
        sleep_score: Math.round(sleepScore),
        exercise_score: Math.round(exerciseScore),
        nutrition_score: Math.round(nutritionScore),
        stress_score: Math.round(stressScore),
      },
      category_scores: {
        sleep: Math.round(sleepScore),
        exercise: Math.round(exerciseScore),
        nutrition: Math.round(nutritionScore),
        stress: Math.round(stressScore),
        overall: overallScore,
      },
      recommendations: [
        {
          category: "overall",
          priority: "medium",
          message: "Edge Function is unavailable. This is a simplified score calculation.",
        },
      ],
      timestamp: new Date().toISOString(),
    }
  }
}
