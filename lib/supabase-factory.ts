import { createClient } from "@supabase/supabase-js"
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { cookies } from "./cookie-utils-universal"
import type { Database } from "@/types/database"

// Singleton instance for browser
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create a client for browser environments
export function createBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("createBrowserSupabaseClient should only be called in the browser")
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return browserClient
}

// Create a client for server environments (works in both App Router and Pages Router)
export function createServerSupabaseClient(context?: { req?: any; res?: any }) {
  // Remove the window check for middleware compatibility

  // If we have req/res objects (Pages API or middleware), use them
  if (context?.req && context?.res) {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies.get(name, { req: context.req, res: context.res })
          },
          set(name: string, value: string, options: any) {
            cookies.set(name, value, { req: context.req, res: context.res, ...options })
          },
          remove(name: string, options: any) {
            cookies.remove(name, { req: context.req, res: context.res, ...options })
          },
        },
      },
    )
  }

  // If we don't have req/res (e.g., in getServerSideProps or App Router),
  // create a regular client without cookie handling
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Create a client specifically for middleware
export function createMiddlewareSupabaseClient(req: Request | any, res: Response | any) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Handle NextRequest from middleware
          if (req.cookies && typeof req.cookies.get === "function") {
            return req.cookies.get(name)?.value
          }
          return undefined
        },
        set(name: string, value: string, options: any) {
          // Handle NextResponse from middleware
          if (res.cookies && typeof res.cookies.set === "function") {
            res.cookies.set({
              name,
              value,
              ...options,
            })
          }
        },
        remove(name: string, options: any) {
          // Handle NextResponse from middleware
          if (res.cookies && typeof res.cookies.set === "function") {
            res.cookies.set({
              name,
              value: "",
              maxAge: 0,
              ...options,
            })
          }
        },
      },
    },
  )
}

// Reset the browser client (useful for testing and auth changes)
export function resetBrowserSupabaseClient() {
  browserClient = null
}

// Get the appropriate client based on environment
export function getSupabaseClient(context?: { req?: any; res?: any }) {
  if (typeof window === "undefined") {
    return createServerSupabaseClient(context)
  } else {
    return createBrowserSupabaseClient()
  }
}
