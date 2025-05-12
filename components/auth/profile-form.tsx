"use client"

import { useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile } from "@/hooks/auth"
import { useEnhancedAuth } from "@/hooks/auth"

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
  location: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { user } = useEnhancedAuth()
  const { fetchProfile, updateProfile, profile, profileState, updateState } = useProfile(user?.id)

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      location: "",
    },
  })

  // Fetch profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id, fetchProfile])

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        phone: profile.phone || "",
        location: profile.location || "",
      })
    }
  }, [profile, form])

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        {profileState.isLoading && <p>Loading profile...</p>}

        {profileState.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{profileState.error}</AlertDescription>
          </Alert>
        )}

        {updateState.isSuccess && (
          <Alert className="mb-4">
            <AlertDescription>Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        {updateState.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{updateState.error}</AlertDescription>
          </Alert>
        )}

        {profile && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" autoComplete="name" disabled={updateState.isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Phone Number"
                        type="tel"
                        autoComplete="tel"
                        disabled={updateState.isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Location" disabled={updateState.isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={updateState.isLoading}>
                {updateState.isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
