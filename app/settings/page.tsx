"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const [theme, setTheme] = useState("system")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [dailyReminderTime, setDailyReminderTime] = useState("08:00")
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("user_settings").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error loading settings:", error)
          return
        }

        if (data) {
          setTheme(data.theme || "system")
          setNotificationsEnabled(data.notifications_enabled)
          setDailyReminderTime(data.daily_reminder_time?.substring(0, 5) || "08:00")
          setWeeklySummaryEnabled(data.weekly_summary_enabled)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()
  }, [user, supabase])

  // Update settings
  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.from("user_settings").upsert({
        id: user.id,
        theme,
        notifications_enabled: notificationsEnabled,
        daily_reminder_time: dailyReminderTime,
        weekly_summary_enabled: weeklySummaryEnabled,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        toast({
          title: "Settings updated",
          description: "Your settings have been updated successfully.",
        })
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <p>Please sign in to view your settings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the wellness dashboard looks</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about your wellness activities</p>
              </div>
              <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>

            {notificationsEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="daily-reminder">Daily reminder time</Label>
                  <Input
                    id="daily-reminder"
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => setDailyReminderTime(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-summary">Weekly summary</Label>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your wellness progress</p>
                  </div>
                  <Switch
                    id="weekly-summary"
                    checked={weeklySummaryEnabled}
                    onCheckedChange={setWeeklySummaryEnabled}
                  />
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="mt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Settings updated successfully!</AlertDescription>
          </Alert>
        )}
        <Button onClick={updateSettings} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
