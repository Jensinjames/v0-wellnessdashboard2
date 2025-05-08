"use client"

import { useOnboarding } from "@/context/onboarding-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { motion } from "framer-motion"
import { useReducedMotion, staggerChildren, staggerItem } from "@/utils/animation-utils"

export function PreferencesStep() {
  const { userPreferences, updatePreferences } = useOnboarding()
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updatePreferences({ theme })
  }

  const handleReminderChange = (time: string | null) => {
    updatePreferences({ reminderTime: time })
  }

  const toggleAccessibilityPreference = (key: keyof typeof userPreferences.accessibilityPreferences) => {
    updatePreferences({
      accessibilityPreferences: {
        ...userPreferences.accessibilityPreferences,
        [key]: !userPreferences.accessibilityPreferences[key],
      },
    })
  }

  const toggleAnimationPreference = () => {
    updatePreferences({
      animationPreferences: {
        ...userPreferences.animationPreferences,
        enableAnimations: !userPreferences.animationPreferences.enableAnimations,
      },
    })
  }

  // Only use animations if they're enabled and reduced motion is not preferred
  const useAnimations = shouldEnableAnimations && !shouldReduceMotion

  return (
    <motion.div
      className="max-w-2xl mx-auto py-4"
      initial={useAnimations ? { opacity: 0 } : { opacity: 1 }}
      animate={useAnimations ? { opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center mb-8"
        initial={useAnimations ? { y: 20, opacity: 0 } : {}}
        animate={useAnimations ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Customize Your Experience</h1>
        <p className="text-muted-foreground">Set your preferences to make the dashboard work best for you.</p>
      </motion.div>

      <motion.div
        className="space-y-6"
        variants={useAnimations ? staggerChildren : {}}
        initial={useAnimations ? "hidden" : false}
        animate={useAnimations ? "visible" : false}
      >
        <motion.div variants={useAnimations ? staggerItem : {}}>
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
                    defaultValue={userPreferences.theme}
                    onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}
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
        </motion.div>

        <motion.div variants={useAnimations ? staggerItem : {}}>
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
                    value={userPreferences.reminderTime || "none"}
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
        </motion.div>

        <motion.div variants={useAnimations ? staggerItem : {}}>
          <Card>
            <CardHeader>
              <CardTitle>Animations</CardTitle>
              <CardDescription>Customize animation settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-animations">Enable animations</Label>
                    <p className="text-sm text-muted-foreground">Toggle animations throughout the interface</p>
                  </div>
                  <Switch
                    id="enable-animations"
                    checked={userPreferences.animationPreferences.enableAnimations}
                    onCheckedChange={toggleAnimationPreference}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={useAnimations ? staggerItem : {}}>
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
                    checked={userPreferences.accessibilityPreferences.reducedMotion}
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
                    checked={userPreferences.accessibilityPreferences.highContrast}
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
                    checked={userPreferences.accessibilityPreferences.largeText}
                    onCheckedChange={() => toggleAccessibilityPreference("largeText")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
