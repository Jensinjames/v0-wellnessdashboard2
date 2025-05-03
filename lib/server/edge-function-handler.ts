import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"
import type { EdgeFunctionContext, EdgeFunctionResponse } from "@/types/supabase"
import type { Database } from "@/types/supabase"

/**
 * Create a handler for Supabase Edge Functions
 * @param handler The function to handle the request
 * @returns A function that handles the request with proper error handling
 */
export function createEdgeFunctionHandler<T = any, P = any>(
  handler: (req: NextRequest, context: EdgeFunctionContext, params?: P) => Promise<EdgeFunctionResponse<T>>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Create a Supabase client for the server
      const cookieStore = cookies()
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: "", ...options })
            },
          },
        },
      )

      // Get the user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Get the user if session exists
      const user = session?.user || null

      // Create context for the handler
      const context: EdgeFunctionContext = {
        user,
        session,
        supabaseClient: supabase,
      }

      // Parse request body if it exists
      let params: P | undefined
      if (req.method !== "GET" && req.headers.get("content-type")?.includes("application/json")) {
        params = (await req.json()) as P
      }

      // Call the handler
      const response = await handler(req, context, params)

      // Return the response
      if (response.error) {
        return NextResponse.json({ error: response.error.message }, { status: response.error.status || 500 })
      }

      return NextResponse.json(response.data)
    } catch (error) {
      console.error("Edge function error:", error)

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 500 },
      )
    }
  }
}
