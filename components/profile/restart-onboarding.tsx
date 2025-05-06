"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RefreshCw } from "lucide-react"

export function RestartOnboarding() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  const handleRestartOnboarding = () => {
    // Clear onboarding cookies and localStorage
    document.cookie = "onboarding-completed=false; path=/; max-age=2592000" // 30 days

    // Clear localStorage items related to onboarding
    const userId = localStorage.getItem("supabase.auth.token")
      ? JSON.parse(localStorage.getItem("supabase.auth.token") || "{}")?.currentSession?.user?.id
      : null

    if (userId) {
      localStorage.removeItem(`onboarding-completed-${userId}`)
      localStorage.removeItem(`onboarding-preferences-${userId}`)
      localStorage.removeItem(`onboarding-step-${userId}`)
    }

    // Redirect to onboarding
    router.push("/onboarding")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Restart Onboarding</CardTitle>
          <CardDescription>Go through the onboarding process again to update your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you'd like to revisit the onboarding experience to set up your wellness goals and preferences again, you
            can restart the process.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setShowConfirmDialog(true)} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restart Onboarding
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              This will take you through the onboarding process again. Your current preferences will be preserved until
              you complete the new onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestartOnboarding}>Restart Onboarding</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
