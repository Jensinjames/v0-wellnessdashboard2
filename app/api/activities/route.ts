import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { activityFormSchema, activityFilterSchema } from "@/schemas/activity-form-schemas"
import { validateWithSchema } from "@/utils/server-validation"
import { generateId } from "@/utils/id-generator"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET handler for activities
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const filter = {
      categories: searchParams.get("categories")?.split(","),
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      minDuration: searchParams.get("minDuration") ? Number(searchParams.get("minDuration")) : undefined,
      maxDuration: searchParams.get("maxDuration") ? Number(searchParams.get("maxDuration")) : undefined,
      tags: searchParams.get("tags")?.split(","),
      searchTerm: searchParams.get("searchTerm") || undefined,
    }

    // Validate filter parameters
    const validationResult = await validateWithSchema(activityFilterSchema, filter, {
      logErrors: true,
      source: "GET /api/activities",
    })

    // Handle validation errors
    if (validationResult.status === "error") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: validationResult.errors },
        { status: 400 },
      )
    }

    // Build query
    let query = supabase.from("activities").select("*")

    // Apply filters
    const validFilter = validationResult.data

    if (validFilter.categories?.length) {
      query = query.in("category", validFilter.categories)
    }

    if (validFilter.startDate) {
      query = query.gte("date", validFilter.startDate.toISOString())
    }

    if (validFilter.endDate) {
      query = query.lte("date", validFilter.endDate.toISOString())
    }

    if (validFilter.minDuration !== undefined) {
      query = query.gte("duration", validFilter.minDuration)
    }

    if (validFilter.maxDuration !== undefined) {
      query = query.lte("duration", validFilter.maxDuration)
    }

    if (validFilter.searchTerm) {
      query = query.ilike("title", `%${validFilter.searchTerm}%`)
    }

    // Execute query
    const { data, error } = await query.order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json({ activities: data })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

/**
 * POST handler for creating a new activity
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate with Zod schema
    const validationResult = await validateWithSchema(activityFormSchema, body, {
      logErrors: true,
      source: "POST /api/activities",
    })

    // Handle validation errors
    if (validationResult.status === "error") {
      return NextResponse.json({ error: "Validation failed", details: validationResult.errors }, { status: 400 })
    }

    // Validated data
    const data = validationResult.data

    // Add ID if not present
    const activityData = {
      ...data,
      id: data.id || generateId(),
      created_at: new Date().toISOString(),
    }

    // Insert into database
    const { error } = await supabase.from("activities").insert(activityData)

    if (error) throw error

    return NextResponse.json({ success: true, data: activityData }, { status: 201 })
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}
