// This file would be deployed to Supabase Edge Functions
// Follow the Supabase CLI instructions to deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    })

    // Get the session of the logged-in user
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const userId = session.user.id

    // Parse the request body
    const { category } = await req.json()

    if (!category) {
      return new Response(JSON.stringify({ error: "Category is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create a Supabase client with the service role key for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Get user's entries for this category
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("wellness_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("timestamp", { ascending: false })
      .limit(20)

    if (entriesError) throw entriesError

    // Get user's goals for this category
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from("wellness_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .single()

    if (goalsError && goalsError.code !== "PGRST116") throw goalsError

    // Generate insights based on the data
    // In a real implementation, you might call an AI service here
    let insights = ""
    let recommendations = []

    if (entries.length === 0) {
      insights = `You haven't logged any ${category} activities yet. Start tracking to get personalized insights.`
      recommendations = [
        `Schedule regular ${category} sessions in your calendar`,
        `Start with small, achievable goals for ${category}`,
        `Find a ${category} buddy to keep you accountable`,
      ]
    } else {
      const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
      const avgDuration = totalDuration / entries.length
      const mostRecent = new Date(entries[0].timestamp)
      const daysSinceLastActivity = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActivity > 7) {
        insights = `It's been ${daysSinceLastActivity} days since your last ${category} activity. Consider getting back into your routine.`
        recommendations = [
          `Schedule your next ${category} session`,
          `Start with a shorter session to ease back in`,
          `Set a reminder for regular ${category} activities`,
        ]
      } else {
        insights = `You've been consistent with your ${category} activities! Your average session is ${Math.round(avgDuration)} minutes.`

        if (goals) {
          const goalMinutes = goals.goal_hours * 60
          const weeklyTotal = entries
            .filter((e) => new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum, entry) => sum + entry.duration, 0)

          if (weeklyTotal >= goalMinutes) {
            insights += ` You've reached your weekly goal of ${goals.goal_hours} hours!`
            recommendations = [
              `Consider increasing your goal for an extra challenge`,
              `Try adding variety to your ${category} routine`,
              `Share your success with friends or community`,
            ]
          } else {
            const remaining = goalMinutes - weeklyTotal
            insights += ` You need ${Math.round(remaining)} more minutes to reach your weekly goal.`
            recommendations = [
              `Schedule ${Math.ceil(remaining / 30)} more 30-minute sessions this week`,
              `Try to increase your session duration slightly`,
              `Set reminders for your ${category} activities`,
            ]
          }
        } else {
          recommendations = [
            `Set a weekly goal for ${category} to track your progress`,
            `Try to increase your session duration gradually`,
            `Explore different types of ${category} activities`,
          ]
        }
      }
    }

    return new Response(
      JSON.stringify({
        category,
        insights,
        recommendations,
        error: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        category: "",
        insights: "",
        recommendations: [],
        error: error.message,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
