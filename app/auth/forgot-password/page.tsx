import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" description="Enter your email to reset your password">
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        {/* Use dynamic import to ensure client component is properly isolated */}
        {/* @ts-expect-error Async Server Component */}
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}

// Use a dynamic import to ensure the client component is properly isolated
async function ForgotPasswordForm() {
  const { ForgotPasswordClient } = await import("@/components/auth/forgot-password-client")
  return <ForgotPasswordClient />
}
