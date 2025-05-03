"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { updateProfile } from "@/lib/profile-service"
import { ProfileAvatarUpload } from "./profile-avatar-upload"
import { PasswordChangeForm } from "./password-change-form"
import { Card, CardContent } from "@/components/ui/card"

const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name cannot be longer than 30 characters.",
    })
    .optional(),
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username cannot be longer than 30 characters.",
    })
    .optional(),
  bio: z
    .string()
    .max(160, {
      message: "Bio cannot be longer than 160 characters.",
    })
    .optional(),
  phone: z
    .string()
    .max(20, {
      message: "Phone number cannot be longer than 20 characters.",
    })
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { user, refreshUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || "",
      username: user?.user_metadata?.username || "",
      bio: user?.user_metadata?.bio || "",
      phone: user?.user_metadata?.phone || "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      await updateProfile(data)
      await refreshUser()
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6 pt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <ProfileAvatarUpload />

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormDescription>This is your public display name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormDescription>This is your public username.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Input placeholder="Tell us about yourself" {...field} />
                        </FormControl>
                        <FormDescription>Brief description for your profile.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>Your contact phone number.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6 pt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium">Email Address</h3>
                <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  To change your email address, please contact support.
                </p>
              </div>

              <Separator />

              <PasswordChangeForm />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
