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

const accessibilitySchema = z.object({
  accessibility_settings: z.object({
    high_contrast: z.boolean(),
    reduced_motion: z.boolean(),
    larger_text: z.boolean(),
  }),
})

type AccessibilityFormValues = z.infer<typeof accessibilitySchema>

interface AccessibilityFormProps {
  onComplete: () => void
}

export function AccessibilityForm({ onComplete }: AccessibilityFormProps) {
  const { profile, updatePreferences } = useProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AccessibilityFormValues>({
    resolver: zodResolver(accessibilitySchema),
    defaultValues: {
      accessibility_settings: {
        high_contrast: profile?.accessibility_settings?.high_contrast || false,
        reduced_motion: profile?.accessibility_settings?.reduced_motion || false,
        larger_text: profile?.accessibility_settings?.larger_text || false,
      },
    },
  })

  const onSubmit = async (values: AccessibilityFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updatePreferences(values)

      if (!result.success) {
        setError(result.error || "Failed to update accessibility settings")
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
        <h3 className="text-lg font-medium">Accessibility Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize your experience to make the application more accessible.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="accessibility_settings.high_contrast"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">High Contrast</FormLabel>
                  <FormDescription>Increase contrast for better visibility.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accessibility_settings.reduced_motion"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Reduced Motion</FormLabel>
                  <FormDescription>Minimize animations and motion effects.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accessibility_settings.larger_text"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Larger Text</FormLabel>
                  <FormDescription>Increase text size throughout the application.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Complete"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
