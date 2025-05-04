import { AuthLayout } from "@/components/auth/auth-layout"
import VerifyEmailClient from "./client"

// Fix: Use the correct value for dynamic
export const dynamic = "force-dynamic"

export default function VerifyEmailPage() {
  return (
    <AuthLayout redirectIfAuthenticated={false} title="Verify Email">
      <VerifyEmailClient />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We've sent you a verification link. Please check your email to verify your account.
        </p>
        <div className="text-center text-muted-foreground">
          <p>If you don't see the email, check your spam folder.</p>
          <p className="mt-4">You can close this page after verifying your email.</p>
        </div>
      </div>
    </AuthLayout>
  )
}
