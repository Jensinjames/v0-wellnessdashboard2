"use client"

import { useState } from "react"
import { useSupabaseSingleton } from "./use-supabase-singleton"
import { isDebugMode } from "@/utils/environment"

// Types for admin operations
type AdminOperation = "get_users" | "delete_user" | "update_user_role"

interface AdminHookReturn {
  isLoading: boolean
  error: string | null
  getUsers: () => Promise<any[]>
  deleteUser: (userId: string) => Promise<boolean>
  updateUserRole: (userId: string, role: string) => Promise<boolean>
}

/**
 * Hook for secure admin operations
 * This ensures sensitive operations are performed through server-side API routes
 * without exposing service role keys to the client
 */
export function useAdmin(): AdminHookReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseSingleton()

  // Debug logging
  const debugLog = (...args: any[]) => {
    if (isDebugMode()) {
      console.log("[Admin]", ...args)
    }
  }

  // Generic function to call admin API
  const callAdminApi = async (operation: AdminOperation, params: any = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the current session to include auth headers
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        throw new Error("You must be authenticated to perform admin operations")
      }

      // Call the secure server-side API
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation,
          params,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Admin operation failed")
      }

      return await response.json()
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred"
      setError(errorMessage)
      debugLog("Admin operation error:", errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Get all users (admin only)
  const getUsers = async (): Promise<any[]> => {
    try {
      const result = await callAdminApi("get_users")
      return result.data || []
    } catch (err) {
      return []
    }
  }

  // Delete a user (admin only)
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await callAdminApi("delete_user", { userId })
      return true
    } catch (err) {
      return false
    }
  }

  // Update a user's role (admin only)
  const updateUserRole = async (userId: string, role: string): Promise<boolean> => {
    try {
      await callAdminApi("update_user_role", { userId, role })
      return true
    } catch (err) {
      return false
    }
  }

  return {
    isLoading,
    error,
    getUsers,
    deleteUser,
    updateUserRole,
  }
}
