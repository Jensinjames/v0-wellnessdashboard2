"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Bell, BarChart, Shield, Layout } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

// Define types for settings
type NotificationFrequency = "all" | "important" | "none"
type MeasurementUnit = "metric" | "imperial"
type DataSharing = "all" | "anonymous" | "none"

// Mock settings hook
const useSettings = () => {
  const [settings, setSettings] = useState({
    notificationEmail: true,
    notificationPush: false,
    notificationFrequency: "important" as NotificationFrequency,
    measurementUnit: "metric" as MeasurementUnit,
    dataSharing: "anonymous" as DataSharing,
    compactView: false,
  })

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
    // In a real app, this would persist to localStorage or a database
    localStorage.setItem("userSettings", JSON.stringify({ ...settings, ...newSettings }))
  }

  return { ...settings, updateSettings }
}

export function SettingsForm() {
  const { setTheme, theme } = useTheme()
  const settings = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  // Local state to track form changes before saving
  const [formState, setFormState] = useState({
    notificationEmail: settings.notificationEmail,
    notificationPush: settings.notificationPush,
    notificationFrequency: settings.notificationFrequency,
    measurementUnit: settings.measurementUnit,
    dataSharing: settings.dataSharing,
    compactView: settings.compactView,
  })

  // Track if form has been modified
  const [isModified, setIsModified] = useState(false)

  const updateFormState = (key: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
    setIsModified(true)
    setStatus("")
  }

  const saveSettings = async () => {
    setIsLoading(true)
    setStatus("Saving your settings...")

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update settings
      settings.updateSettings(formState)
      setIsModified(false)
      setStatus("Settings saved successfully!")

      // Show toast notification
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully.",
      })
    } catch (error) {
      setStatus("Failed to save settings. Please try again.")
      toast({
        title: "Error",
        description: "There was a problem saving your settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormState({
      notificationEmail: settings.notificationEmail,
      notificationPush: settings.notificationPush,
      notificationFrequency: settings.notificationFrequency,
      measurementUnit: settings.measurementUnit,
      dataSharing: settings.dataSharing,
      compactView: settings.compactView,
    })
    setIsModified(false)
    setStatus("")
  }

  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList className="grid w-full grid-cols-4 md:w-fit">
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      {status && <div className="my-4 p-3 rounded-md border bg-blue-50 text-blue-700">{status}</div>}

      {/* Appearance Tab */}
      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the dashboard looks and feels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">Select the color theme for the dashboard.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme("light")}
                    className={theme === "light" ? "border-primary" : ""}
                    aria-label="Light mode"
                  >
                    <Sun className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme("dark")}
                    className={theme === "dark" ? "border-primary" : ""}
                    aria-label="Dark mode"
                  >
                    <Moon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme("system")}
                    className={theme === "system" ? "border-primary" : ""}
                  >
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <Label className="text-base">Compact View</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Use a more compact layout for dashboard components.</p>
                </div>
                <Switch
                  checked={formState.compactView}
                  onCheckedChange={(checked) => updateFormState("compactView", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how and when you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label className="text-base">Email Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                </div>
                <Switch
                  checked={formState.notificationEmail}
                  onCheckedChange={(checked) => updateFormState("notificationEmail", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label className="text-base">Push Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser.</p>
                </div>
                <Switch
                  checked={formState.notificationPush}
                  onCheckedChange={(checked) => updateFormState("notificationPush", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <Select
                  value={formState.notificationFrequency}
                  onValueChange={(value) => updateFormState("notificationFrequency", value as NotificationFrequency)}
                >
                  <SelectTrigger id="notification-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All notifications</SelectItem>
                    <SelectItem value="important">Important only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose which types of notifications you want to receive.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Data & Privacy Tab */}
      <TabsContent value="data">
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>Manage your data and privacy preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label htmlFor="data-sharing">Data Sharing</Label>
                </div>
                <Select
                  value={formState.dataSharing}
                  onValueChange={(value) => updateFormState("dataSharing", value as DataSharing)}
                >
                  <SelectTrigger id="data-sharing">
                    <SelectValue placeholder="Select data sharing preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Share all data</SelectItem>
                    <SelectItem value="anonymous">Anonymous data only</SelectItem>
                    <SelectItem value="none">No data sharing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Control how your data is shared for analytics and improvements.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <Label htmlFor="measurement-unit">Measurement Units</Label>
                </div>
                <Select
                  value={formState.measurementUnit}
                  onValueChange={(value) => updateFormState("measurementUnit", value as MeasurementUnit)}
                >
                  <SelectTrigger id="measurement-unit">
                    <SelectValue placeholder="Select measurement unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Choose your preferred measurement system.</p>
              </div>

              <Separator />

              <div className="pt-2">
                <Button variant="outline" className="text-destructive">
                  Export My Data
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  Download all your personal data in a portable format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Tab */}
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="User Name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="user@example.com"
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <input
                  id="current-password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <input
                  id="new-password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <input
                  id="confirm-password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button className="w-full">Update Password</Button>

              <Separator />

              <div className="pt-2">
                <Button variant="destructive">Delete Account</Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  This will permanently delete your account and all associated data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {isModified && (
        <CardFooter className="flex justify-between border rounded-lg p-4 mt-6">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Tabs>
  )
}
