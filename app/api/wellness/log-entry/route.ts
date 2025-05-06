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
    const { categoryId, activityId, minutes, notes } = body

    if (!categoryId || !minutes || minutes <= 0) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    // Use the admin client to insert the entry
    const adminClient = getSupabaseAdmin()
    const userId = session.user.id
    const today = new Date().toISOString().split("T")[0]

    const entry = {
      user_id: userId,
      category_id: categoryId,
      activity_id: activityId || null,
      entry_date: today,
      minutes_spent: minutes,
      notes: notes || null,
    }

    const { data, error } = await adminClient.from("wellness_entries").insert([entry]).select().single()

    if (error) {
      throw error
    }

    // Revalidate the dashboard page
    revalidatePath("/dashboard")

    return NextResponse.json({ success: true, entry: data })
  } catch (error) {
    console.error("Error logging wellness entry:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
