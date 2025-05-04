"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useProfile } from "@/context/profile-context"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const notificationsSchema = z.object({
  email_notifications: z.boolean(),
  notification_preferences: z.object({
    activity_updates: z.boolean(),
    new_features: z.boolean(),
    marketing: z.boolean(),
  }),
})

type NotificationsFormValues = z.infer<typeof notificationsSchema>

interface NotificationsFormProps {
  onComplete: () => void
}

export function NotificationsForm({ onComplete }: NotificationsFormProps) {
  const { profile, updatePreferences } = useProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      email_notifications: profile?.email_notifications !== false,
      notification_preferences: {
        activity_updates: profile?.notification_preferences?.activity_updates !== false,
        new_features: profile?.notification_preferences?.new_features !== false,
        marketing: profile?.notification_preferences?.marketing === true,
      },
    },
  })

  const onSubmit = async (values: NotificationsFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updatePreferences(values)

      if (!result.success) {
        setError(result.error || "Failed to update notification preferences")
        return
      }

      onComplete()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">Choose how and when you want to be notified.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email_notifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>Receive notifications via email.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Types</h4>

            <FormField
              control={form.control}
              name="notification_preferences.activity_updates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activity Updates</FormLabel>
                    <FormDescription>Get notified about your activity and progress.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!form.watch("email_notifications")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notification_preferences.new_features"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">New Features</FormLabel>
                    <FormDescription>Get notified about new features and updates.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!form.watch("email_notifications")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notification_preferences.marketing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing</FormLabel>
                    <FormDescription>Receive marketing and promotional emails.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!form.watch("email_notifications")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
