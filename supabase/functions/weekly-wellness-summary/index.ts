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

    // Create a Supabase client with the service role key for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Call the database function to get weekly summary
    const { data, error } = await supabaseAdmin.rpc("get_weekly_wellness_summary", {
      user_uuid: userId,
    })

    if (error) throw error

    // Generate insights for each category
    const enhancedData = data.map((item) => {
      // In a real implementation, you might call an AI service here
      // For this example, we'll generate simple insights based on the data
      let insights = ""

      if (item.total_duration > 300) {
        insights = `Great job! You spent over 5 hours on ${item.category} this week.`
      } else if (item.total_duration > 120) {
        insights = `You're making good progress with ${item.category} activities.`
      } else {
        insights = `Consider increasing your ${item.category} activities for better results.`
      }

      return {
        ...item,
        insights,
      }
    })

    return new Response(JSON.stringify({ data: enhancedData, error: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ data: [], error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
