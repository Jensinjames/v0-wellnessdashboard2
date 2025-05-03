import { createEdgeFunctionHandler } from "@/lib/server/edge-function-handler"

// Define the request parameters type
interface ProfileUpdateParams {
  username?: string
  full_name?: string
  bio?: string
  website?: string
}

// Handle GET request to fetch profile
export const GET = createEdgeFunctionHandler(async (req, context) => {
  const { user, supabaseClient } = context

  // Check if user is authenticated
  if (!user) {
    return {
      data: null,
      error: {
        message: "Unauthorized",
        status: 401,
      },
    }
  }

  try {
    // Fetch user profile
    const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      throw error
    }

    return {
      data,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching profile:", error)

    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch profile",
        status: 500,
      },
    }
  }
})

// Handle POST request to update profile
export const POST = createEdgeFunctionHandler(async (req, context, params: ProfileUpdateParams) => {
  const { user, supabaseClient } = context

  // Check if user is authenticated
  if (!user) {
    return {
      data: null,
      error: {
        message: "Unauthorized",
        status: 401,
      },
    }
  }

  try {
    // Validate input
    if (!params) {
      return {
        data: null,
        error: {
          message: "No update parameters provided",
          status: 400,
        },
      }
    }

    // Update profile
    const { data, error } = await supabaseClient
      .from("profiles")
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      data,
      error: null,
    }
  } catch (error) {
    console.error("Error updating profile:", error)

    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Failed to update profile",
        status: 500,
      },
    }
  }
})
