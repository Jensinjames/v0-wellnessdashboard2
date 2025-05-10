"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { checkEmailServiceAvailability } from "@/lib/supabase-manager"

// Form schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Check if email service is available
      const isEmailAvailable = await checkEmailServiceAvailability()

      if (!isEmailAvailable) {
        toast({
          title: "Email Service Unavailable",
          description: "The email service is currently unavailable. Please try again later.",
          variant: "destructive",
        })
        return
      }

      // Send password reset email
      const { error } = await resetPassword(values.email)

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send password reset email",
          variant: "destructive",
        })
        return
      }

      // Show success message
      setEmailSent(true)
      toast({
        title: "Email Sent",
        description: "Check your email for a password reset link",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {emailSent ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <p>
              We've sent you an email with a link to reset your password. Please check your inbox and follow the
              instructions.
            </p>
          </div>
          <Button className="w-full" onClick={() => router.push("/auth/sign-in")}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/auth/sign-in")}
              disabled={isLoading}
            >
              Back to Sign In
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
