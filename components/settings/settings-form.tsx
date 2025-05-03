"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Moon, Sun, Bell, BarChart, Shield, User, AlertCircle } from "lucide-react"
import { useSettings } from "@/context/settings-context"
import { FormStatus } from "@/components/ui/form-status"
import { z } from "zod"

// Define validation schema
const accountSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false
      }
      return true
    },
    {
      message: "Current password is required when setting a new password",
      path: ["currentPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false
      }
      return true
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

export function SettingsForm() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState(settings)
  const [formModified, setFormModified] = useState(false)
  const [formStatus, setFormStatus] = useState<{ message: string; type: "loading" | "success" | "error" } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update form state when settings are loaded
  useEffect(() => {
    setFormState(settings)
  }, [settings])

  const updateFormState = (key: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
    setFormModified(true)

    // Clear validation error for this field if it exists
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    // Validate account fields if we're on the account tab
    try {
      if (formState.currentPassword || formState.newPassword || formState.confirmPassword) {
        accountSchema.parse({
          name: formState.name,
          email: formState.email,
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword,
          confirmPassword: formState.confirmPassword,
        })
      } else {
        // Just validate name and email
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Please enter a valid email address"),
        }).parse({
          name: formState.name,
          email: formState.email,
        })
      }
      setValidationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setValidationErrors(errors)
      }
      return false
    }
  }

  const handleSaveSettings = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setFormStatus({ message: "Saving your settings...", type: "loading" })

    try {
      await updateSettings(formState)

      setFormStatus({ message: "Settings saved successfully!", type: "success" })
      setFormModified(false)

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })

      // Clear form status after a delay
      setTimeout(() => {
        setFormStatus(null)
      }, 3000)
    } catch (error) {
      setFormStatus({ message: "Failed to save settings. Please try again.", type: "error" })

      toast({
        title: "Error",
        description: "There was a problem saving your settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetForm = () => {
    setFormState(settings)
    setFormModified(false)
    setValidationErrors({})
    setFormStatus(null)
  }

  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      {formStatus && (
        <FormStatus
          variant={formStatus.type === "loading" ? "loading" : formStatus.type === "success" ? "success" : "error"}
          message={formStatus.message}
          className="mb-6"
        />
      )}

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
                  <Label className="text-base">Compact View</Label>
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
                  checked={formState.emailNotifications}
                  onCheckedChange={(checked) => updateFormState("emailNotifications", checked)}
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
                  checked={formState.pushNotifications}
                  onCheckedChange={(checked) => updateFormState("pushNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <Select
                  value={formState.notificationFrequency}
                  onValueChange={(value) => updateFormState("notificationFrequency", value)}
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
                <Select value={formState.dataSharing} onValueChange={(value) => updateFormState("dataSharing", value)}>
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
                  onValueChange={(value) => updateFormState("measurementUnit", value)}
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
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Label htmlFor="name">Name</Label>
                </div>
                <div className="relative">
                  <Input
                    id="name"
                    value={formState.name || ""}
                    onChange={(e) => updateFormState("name", e.target.value)}
                    className={validationErrors.name ? "border-destructive" : ""}
                  />
                  {validationErrors.name && (
                    <div className="flex items-center text-destructive text-xs mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formState.email || ""}
                    onChange={(e) => updateFormState("email", e.target.value)}
                    className={validationErrors.email ? "border-destructive" : ""}
                  />
                  {validationErrors.email && (
                    <div className="flex items-center text-destructive text-xs mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.email}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type="password"
                    value={formState.currentPassword || ""}
                    onChange={(e) => updateFormState("currentPassword", e.target.value)}
                    className={validationErrors.currentPassword ? "border-destructive" : ""}
                  />
                  {validationErrors.currentPassword && (
                    <div className="flex items-center text-destructive text-xs mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.currentPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type="password"
                    value={formState.newPassword || ""}
                    onChange={(e) => updateFormState("newPassword", e.target.value)}
                    className={validationErrors.newPassword ? "border-destructive" : ""}
                  />
                  {validationErrors.newPassword && (
                    <div className="flex items-center text-destructive text-xs mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.newPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type="password"
                    value={formState.confirmPassword || ""}
                    onChange={(e) => updateFormState("confirmPassword", e.target.value)}
                    className={validationErrors.confirmPassword ? "border-destructive" : ""}
                  />
                  {validationErrors.confirmPassword && (
                    <div className="flex items-center text-destructive text-xs mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  // Validate just the password fields
                  validateForm()
                }}
                disabled={!formState.currentPassword && !formState.newPassword && !formState.confirmPassword}
              >
                Update Password
              </Button>

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

      {formModified && (
        <div className="flex justify-between items-center border rounded-lg p-4 mt-6">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetForm} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </Tabs>
  )
}
