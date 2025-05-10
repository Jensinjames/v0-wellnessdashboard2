"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"

// Types for admin operations
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
  const { session } = useAuth()

  // Generic function to call admin API
  const callAdminApi = async (endpoint: string, method = "GET", body?: any) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!session) {
        throw new Error("You must be authenticated to perform admin operations")
      }

      // Call the secure server-side API
      const response = await fetch(`/api/admin/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Admin operation failed")
      }

      return await response.json()
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred"
      setError(errorMessage)
      console.error("Admin operation error:", errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Get all users (admin only)
  const getUsers = async (): Promise<any[]> => {
    try {
      const result = await callAdminApi("users")
      return result.users || []
    } catch (err) {
      return []
    }
  }

  // Delete a user (admin only)
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await callAdminApi(`users/${userId}`, "DELETE")
      return true
    } catch (err) {
      return false
    }
  }

  // Update a user's role (admin only)
  const updateUserRole = async (userId: string, role: string): Promise<boolean> => {
    try {
      await callAdminApi(`users/${userId}/role`, "PUT", { role })
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
