"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ProfileForm() {
  const { user, profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: user?.email || "",
    theme: profile?.preferences?.theme || "system",
    reminderTime: profile?.preferences?.reminderTime || null,
    accessibilityPreferences: {
      reducedMotion: profile?.preferences?.accessibility?.reducedMotion || false,
      highContrast: profile?.preferences?.accessibility?.highContrast || false,
      largeText: profile?.preferences?.accessibility?.largeText || false,
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleThemeChange = (theme: string) => {
    setFormData((prev) => ({ ...prev, theme }))
  }

  const handleReminderChange = (time: string | null) => {
    setFormData((prev) => ({ ...prev, reminderTime: time }))
  }

  const toggleAccessibilityPreference = (key: keyof typeof formData.accessibilityPreferences) => {
    setFormData((prev) => ({
      ...prev,
      accessibilityPreferences: {
        ...prev.accessibilityPreferences,
        [key]: !prev.accessibilityPreferences[key],
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form data
      if (!formData.first_name || !formData.last_name) {
        setError("Please provide both first and last name")
        setIsSubmitting(false)
        return
      }

      // Update profile
      const { error } = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        preferences: {
          theme: formData.theme,
          reminderTime: formData.reminderTime,
          accessibility: formData.accessibilityPreferences,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)

        // Set onboarding as completed in cookie
        document.cookie = "onboarding-completed=true; path=/; max-age=2592000" // 30 days
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>Your profile has been updated successfully.</AlertDescription>
          </Alert>
        )}

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} disabled />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose how the dashboard looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <RadioGroup
                      value={formData.theme}
                      onValueChange={handleThemeChange}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="font-normal cursor-pointer">
                          Light
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="font-normal cursor-pointer">
                          Dark
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system" className="font-normal cursor-pointer">
                          System
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reminders</CardTitle>
                <CardDescription>Set up daily reminders to track your wellness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="reminder-time">Daily reminder time</Label>
                    <Select
                      value={formData.reminderTime || "none"}
                      onValueChange={(value) => handleReminderChange(value === "none" ? null : value)}
                    >
                      <SelectTrigger id="reminder-time">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No reminders</SelectItem>
                        <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                        <SelectItem value="evening">Evening (8:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>Customize the dashboard for your accessibility needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduced-motion">Reduced motion</Label>
                      <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={formData.accessibilityPreferences.reducedMotion}
                      onCheckedChange={() => toggleAccessibilityPreference("reducedMotion")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High contrast</Label>
                      <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={formData.accessibilityPreferences.highContrast}
                      onCheckedChange={() => toggleAccessibilityPreference("highContrast")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="large-text">Larger text</Label>
                      <p className="text-sm text-muted-foreground">Increase text size throughout the app</p>
                    </div>
                    <Switch
                      id="large-text"
                      checked={formData.accessibilityPreferences.largeText}
                      onCheckedChange={() => toggleAccessibilityPreference("largeText")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <CardFooter className="flex justify-end pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Tabs>
    </form>
  )
}
