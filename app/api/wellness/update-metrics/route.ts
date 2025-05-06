import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-client"
import { getSupabaseClient } from "@/lib/supabase-client"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    // Get the current session to verify the user
    const supabase = getSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { motivation_level, sleep_hours, daily_score, notes } = body

    // Use the admin client to update metrics
    const adminClient = getSupabaseAdmin()
    const userId = session.user.id
    const today = new Date().toISOString().split("T")[0]

    // Check if metrics exist for today
    const { data: existingMetrics, error: checkError } = await adminClient
      .from("wellness_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    let result

    if (existingMetrics) {
      // Update existing metrics
      const { data, error } = await adminClient
        .from("wellness_metrics")
        .update({
          motivation_level,
          sleep_hours,
          daily_score,
          notes,
        })
        .eq("id", existingMetrics.id)
        .select()
        .single()

      if (error) {
        throw error
      }
      result = data
    } else {
      // Insert new metrics
      const { data, error } = await adminClient
        .from("wellness_metrics")
        .insert([
          {
            user_id: userId,
            entry_date: today,
            motivation_level,
            sleep_hours,
            daily_score,
            notes,
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }
      result = data
    }

    // Revalidate the dashboard page
    revalidatePath("/dashboard")

    return NextResponse.json({ success: true, metrics: result })
  } catch (error) {
    console.error("Error updating daily metrics:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
