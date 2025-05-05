import { type NextRequest, NextResponse } from "next/server"
import type { z } from "zod"
import { validateWithSchema } from "@/utils/server-validation"

/**
 * Middleware to validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  options?: {
    source?: string
    logErrors?: boolean
  },
) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate with schema
    const validationResult = await validateWithSchema(schema, body, {
      logErrors: options?.logErrors ?? true,
      source: options?.source || request.url,
    })

    // Handle validation errors
    if (validationResult.status === "error") {
      return {
        isValid: false,
        response: NextResponse.json({ error: "Validation failed", details: validationResult.errors }, { status: 400 }),
        data: null,
      }
    }

    // Return validated data
    return {
      isValid: true,
      response: null,
      data: validationResult.data,
    }
  } catch (error) {
    console.error("Error validating request:", error)
    return {
      isValid: false,
      response: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
      data: null,
    }
  }
}
