import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

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

    if (!edgeFunctionUrl) {
      console.error("Missing SUPABASE_EDGE_FUNCTION_URL environment variable")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Call the Edge Function with server-side credentials
    const response = await fetch(`${edgeFunctionUrl}/user-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use service role key for admin operations if needed
        // "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle specific error cases
      if (data.error?.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
      }

      return NextResponse.json({ error: data.error || "Signup failed" }, { status: response.status })
    }

    // Return success response
    return NextResponse.json({
      user: data.user,
      emailVerificationSent: true,
      message: "Signup successful",
    })
  } catch (error: any) {
    console.error("Edge signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
