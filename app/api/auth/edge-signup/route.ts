/**
 * Edge Signup API Route
 * Handles user signup through Supabase Edge Functions with fallback
 */
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { signUpUserWithEdgeFunction } from "@/services/edge-function-service"
import { isEdgeFunctionAvailable } from "@/lib/edge-function-config"

// Validation schema
const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const result = signUpSchema.safeParse(body)

    if (!result.success) {
      // Return validation errors
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        if (error.path) {
          fieldErrors[error.path[0]] = error.message
        }
      })

      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 })
    }

    const { email, password } = result.data

    // Get the Edge Function URL from environment variables
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL

    // Check if Edge Function is available
    const isEdgeFunctionActive = edgeFunctionUrl ? await isEdgeFunctionAvailable(edgeFunctionUrl) : false

    // If Edge Function is available, use it
    if (isEdgeFunctionActive) {
      try {
        // Call the Edge Function service
        const data = await signUpUserWithEdgeFunction(email, password)

        // Return success response
        return NextResponse.json({
          user: data.user,
          emailVerificationSent: data.emailVerificationSent ?? true,
          message: "Signup successful",
        })
      } catch (error: any) {
        console.error("Edge function error:", error.message)

        // Check for specific error types
        if (error.message?.includes("already exists")) {
          return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
        }

        // Log the error but fall through to direct signup as backup
        console.log("Falling back to direct Supabase signup due to Edge Function error")
      }
    } else {
      console.log("Edge Function not available, using direct Supabase signup")
    }

    // Fallback to direct Supabase signup if Edge Function is unavailable or fails
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      user: data.user,
      emailVerificationSent: true,
      message: "Signup successful",
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
