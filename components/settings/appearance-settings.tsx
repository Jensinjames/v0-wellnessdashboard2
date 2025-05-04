"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  fontSize: z.enum(["small", "medium", "large"], {
    required_error: "Please select a font size.",
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "system",
      highContrast: false,
      reducedMotion: false,
      fontSize: "medium",
    },
  })

  async function onSubmit(data: AppearanceFormValues) {
    setIsLoading(true)

    try {
      // Here you would typically save the settings to your backend
      // For now, we'll just simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Appearance settings updated",
        description: "Your appearance settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "There was an error saving your appearance settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize how the application looks and feels.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Theme</FormLabel>
                <FormDescription>Select the theme for the dashboard.</FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-4"
                  >
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="light" className="sr-only" aria-label="Light theme" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">Light</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="dark" className="sr-only" aria-label="Dark theme" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">Dark</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="system" className="sr-only" aria-label="System theme" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">System</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="highContrast"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">High Contrast</FormLabel>
                  <FormDescription>Increase contrast for better readability.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reducedMotion"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Reduced Motion</FormLabel>
                  <FormDescription>Reduce motion effects for accessibility.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fontSize"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Font Size</FormLabel>
                <FormDescription>Select the font size for the dashboard.</FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-4"
                  >
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="small" className="sr-only" aria-label="Small font size" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">Small</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="medium" className="sr-only" aria-label="Medium font size" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">Medium</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="large" className="sr-only" aria-label="Large font size" />
                      </FormControl>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground">
                          <div className="mb-2 text-center font-medium">Large</div>
                        </div>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
