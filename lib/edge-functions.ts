import { supabase } from "@/lib/supabase"
import type { EdgeFunctionResponse } from "@/types/supabase"

/**
 * Generic function to call Supabase Edge Functions
 * @param functionName The name of the edge function to call
 * @param params Optional parameters to pass to the function
 * @param options Optional request options
 * @returns Promise with the edge function response
 */
export async function callEdgeFunction<T = any, P = any>(
  functionName: string,
  params?: P,
  options: {
    headers?: HeadersInit
    method?: "GET" | "POST" | "PUT" | "DELETE"
  } = {},
): Promise<EdgeFunctionResponse<T>> {
  try {
    const { method = "POST", headers = {} } = options

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Prepare headers with auth token if available
    const authHeaders: HeadersInit = session
      ? {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          ...headers,
        }
      : {
          "Content-Type": "application/json",
          ...headers,
        }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: authHeaders,
      body: params && method !== "GET" ? JSON.stringify(params) : undefined,
    }

    // Build URL with query params for GET requests
    let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`

    if (method === "GET" && params) {
      const queryParams = new URLSearchParams()
      Object.entries(params as Record<string, string>).forEach(([key, value]) => {
        queryParams.append(key, value)
      })
      url += `?${queryParams.toString()}`
    }

    // Make the request
    const response = await fetch(url, requestOptions)

    // Parse the response
    const data = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: data.error || "An error occurred while calling the edge function",
          status: response.status,
        },
      }
    }

    return {
      data,
      error: null,
    }
  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error)
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "An unknown error occurred",
        status: 500,
      },
    }
  }
}

/**
 * Create a typed edge function caller
 * @param functionName The name of the edge function
 * @returns A function that calls the edge function with the correct types
 */
export function createEdgeFunctionCaller<T = any, P = any>(functionName: string) {
  return async (
    params?: P,
    options?: {
      headers?: HeadersInit
      method?: "GET" | "POST" | "PUT" | "DELETE"
    },
  ): Promise<EdgeFunctionResponse<T>> => {
    return callEdgeFunction<T, P>(functionName, params, options)
  }
}
