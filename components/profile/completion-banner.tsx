"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"

export function ProfileCompletionBanner() {
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Get user and profile directly from Supabase
  useEffect(() => {
    const getAuthData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          setUser(userData.user)

          // Get profile data
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

          if (profileData) {
            setProfile(profileData)

            // Set completion percentage if available
            if (profileData.completion_status) {
              setCompletionPercentage(profileData.completion_status.percent_complete || 0)
              setIsVisible(!profileData.completion_status.is_complete)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching auth data:", error)
      }
    }

    getAuthData()
  }, [supabase])

  // Don't render if no user, profile is complete, or banner is dismissed
  if (!user || !isVisible) {
    return null
  }

  const handleContinue = () => {
    router.push("/profile/complete")
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 p-2">
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Complete your profile to unlock all features</p>
            <div className="flex items-center mt-1">
              <Progress value={completionPercentage} className="h-2 flex-1" />
              <span className="ml-2 text-xs">{completionPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleContinue}>
            Continue Setup
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
