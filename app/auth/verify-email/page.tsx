import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Verify Your Email" description="We've sent a verification link to your email address">
      <div className="space-y-4">
        <p className="text-center text-sm text-gray-600">
          Please check your email and click the verification link to complete your registration.
        </p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/auth/sign-in">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
