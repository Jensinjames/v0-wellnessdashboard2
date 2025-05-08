"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function RestartOnboarding() {
  const { toast } = useToast()
  const router = useRouter()

  const handleRestart = () => {
    toast({
      title: "Onboarding has been removed",
      description: "The onboarding feature has been removed from the application.",
    })
  }

  return (
    <div className="mt-4">
      <Button variant="outline" onClick={handleRestart} className="w-full">
        Restart Onboarding (Disabled)
      </Button>
    </div>
  )
}
