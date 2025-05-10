import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { anonymousId, userId } = await request.json()

    if (!anonymousId || !userId) {
      return NextResponse.json({ error: "Anonymous ID and User ID are required" }, { status: 400 })
    }

    console.log(`Linking anonymous data from ${anonymousId} to ${userId}`)

    // Update wellness entries
    const { error: entriesError } = await supabaseAdmin
      .from("wellness_entries")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (entriesError) {
      console.error("Error updating wellness entries:", entriesError)
    }

    // Update wellness goals
    const { error: goalsError } = await supabaseAdmin
      .from("wellness_goals")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (goalsError) {
      console.error("Error updating wellness goals:", goalsError)
    }

    // Update wellness insights
    const { error: insightsError } = await supabaseAdmin
      .from("wellness_insights")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (insightsError) {
      console.error("Error updating wellness insights:", insightsError)
    }

    return NextResponse.json({
      success: true,
      message: "Anonymous data linked successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in link-anonymous-data route:", error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
