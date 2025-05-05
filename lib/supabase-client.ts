import { createClient } from "@supabase/supabase-js"

// Create a singleton instance of the Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    return supabaseClient
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    // Return a mock client that will gracefully fail for preview environments
    return createMockClient()
  }
}

// Create a separate client for server-side operations
export function getServerSupabaseClient() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables for server client")
      throw new Error("Missing Supabase environment variables for server client")
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error initializing server Supabase client:", error)
    // Return a mock client that will gracefully fail for preview environments
    return createMockClient()
  }
}

// Create a mock client that returns empty data for preview environments
function createMockClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
              data: [],
              error: null,
            }),
            data: [],
            error: null,
          }),
          data: [],
          error: null,
        }),
        data: [],
        error: null,
      }),
      insert: () => ({
        select: async () => ({ data: [], error: null }),
        data: null,
        error: null,
      }),
      update: () => ({
        eq: () => ({
          data: null,
          error: null,
        }),
        data: null,
        error: null,
      }),
      delete: () => ({
        eq: () => ({
          data: null,
          error: null,
        }),
        data: null,
        error: null,
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
  } as any
}
