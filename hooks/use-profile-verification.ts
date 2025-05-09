"use client"

import { useState, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import { useToast } from "./use-toast"

export function useProfileVerification() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const verifyProfile = useCallback(
    async (userId: string) => {
      if (isVerifying || isVerified) return

      setIsVerifying(true)

      try {
        // First check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single()

        if (profileError) {
          if (profileError.code === "PGRST116") {
            // Profile doesn't exist, call the repair function
            const { data, error } = await supabase.rpc("ensure_user_profile", {
              user_id: userId,
            })

            if (error) {
              throw error
            }

            if (data) {
              toast({
                title: "Profile verified",
                description: "Your profile has been verified and repaired if needed",
              })
            }
          } else {
            throw profileError
          }
        }

        setIsVerified(true)
      } catch (error: any) {
        console.error("Error verifying profile:", error)
        toast({
          title: "Profile verification error",
          description: "There was an error verifying your profile",
          variant: "destructive",
        })
      } finally {
        setIsVerifying(false)
      }
    },
    [supabase, toast, isVerifying, isVerified],
  )

  return {
    verifyProfile,
    isVerifying,
    isVerified,
  }
}
