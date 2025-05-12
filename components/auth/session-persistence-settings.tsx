"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { PersistenceMode } from "@/lib/auth/session-persistence"

export function SessionPersistenceSettings() {
  const { persistenceMode, setPersistenceMode, signOut } = useAuth()
  const [selectedMode, setSelectedMode] = useState<PersistenceMode>(persistenceMode)

  const handleModeChange = (mode: PersistenceMode) => {
    setSelectedMode(mode)
  }

  const handleSave = () => {
    setPersistenceMode(selectedMode)
    toast({
      title: "Session settings updated",
      description: "Your session persistence preferences have been saved.",
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Session Settings</CardTitle>
        <CardDescription>Control how long you stay signed in across browser sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedMode}
          onValueChange={(value) => handleModeChange(value as PersistenceMode)}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="local" id="persistence-local" />
            <div className="grid gap-1.5">
              <Label htmlFor="persistence-local" className="font-medium">
                Remember me
              </Label>
              <p className="text-sm text-muted-foreground">
                Stay signed in until you explicitly sign out, even if you close the browser
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="session" id="persistence-session" />
            <div className="grid gap-1.5">
              <Label htmlFor="persistence-session" className="font-medium">
                Remember until browser close
              </Label>
              <p className="text-sm text-muted-foreground">Stay signed in until you close your browser</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value="none" id="persistence-none" />
            <div className="grid gap-1.5">
              <Label htmlFor="persistence-none" className="font-medium">
                Don't remember me
              </Label>
              <p className="text-sm text-muted-foreground">
                Sign out when you refresh or leave the page (not recommended)
              </p>
            </div>
          </div>
        </RadioGroup>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => signOut()} className="text-destructive hover:text-destructive">
            Sign out from all devices
          </Button>
          <Button onClick={handleSave}>Save preferences</Button>
        </div>
      </CardContent>
    </Card>
  )
}
