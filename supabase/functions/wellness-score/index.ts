import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { calculateWellnessScore } from "./score-calculator.ts"
import { getRecommendations } from "./recommendations.ts"

// Read environment variables
const API_KEY = Deno.env.get("WELLNESS_API_KEY") || "default-dev-key"
const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || "development"

interface WellnessMetrics {
  sleep: number // hours of sleep
  exercise: number // minutes of exercise
  meditation: number // minutes of meditation
  water: number // glasses of water
  nutrition: number // 1-10 rating of nutrition quality
  stress: number // 1-10 stress level (10 being highest stress)
  mood: number // 1-10 mood rating (10 being best mood)
  userId?: string // optional user ID for personalization
  category?: string // optional category focus (e.g., "sleep", "exercise")
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const requestData = await req.json()

    // Validate API key if not in development
    if (ENVIRONMENT !== "development") {
      const authHeader = req.headers.get("Authorization")
      const providedKey = authHeader?.split("Bearer ")[1]

      if (providedKey !== API_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    // Validate input data
    const metrics = requestData.metrics as WellnessMetrics
    if (!metrics || typeof metrics !== "object") {
      return new Response(JSON.stringify({ error: "Invalid metrics data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validate required fields
    const requiredFields = ["sleep", "exercise", "water", "nutrition", "stress", "mood"]
    const missingFields = requiredFields.filter((field) => metrics[field as keyof WellnessMetrics] === undefined)

    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ error: `Missing required fields: ${missingFields.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Calculate wellness score
    const score = calculateWellnessScore(metrics)

    // Get personalized recommendations
    const recommendations = getRecommendations(score, metrics)

    // Return the results
    return new Response(
      JSON.stringify({
        score,
        category_scores: {
          sleep: score.sleep_score,
          exercise: score.exercise_score,
          nutrition: score.nutrition_score,
          stress: score.stress_score,
          overall: score.overall_score,
        },
        recommendations,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60", // Cache for 60 seconds
        },
      },
    )
  } catch (error) {
    // Log the error (Supabase Edge Functions automatically collect logs)
    console.error(`Error processing wellness score: ${error.message}`)

    // Return a friendly error response
    return new Response(
      JSON.stringify({
        error: "Failed to process wellness data",
        message: ENVIRONMENT === "development" ? error.message : "An internal error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
