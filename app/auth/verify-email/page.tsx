import { AuthLayout } from "@/components/auth/auth-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RedirectHandler } from "@/components/auth/redirect-handler"

export default function VerifyEmailPage() {
  return (
    <AuthLayout redirectIfAuthenticated={false}>
      <RedirectHandler />
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We've sent you a verification link. Please check your email to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">
          <p>If you don't see the email, check your spam folder.</p>
          <p className="mt-4">You can close this page after verifying your email.</p>
        </div>
      </CardContent>
    </AuthLayout>
  )
}
