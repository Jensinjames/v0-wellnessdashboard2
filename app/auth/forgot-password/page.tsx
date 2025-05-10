import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" description="Enter your email to reset your password">
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}

// Use a server component to load the client component
function ForgotPasswordForm() {
  // This is a server component that dynamically imports the client component
  return <ForgotPasswordFormClient />
}

// Use a client component for the form
import { ForgotPasswordFormClient } from "@/components/auth/forgot-password-form-client"
