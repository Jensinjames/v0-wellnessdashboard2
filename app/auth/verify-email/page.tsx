import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-3 text-center text-2xl">Verify your email</CardTitle>
          <CardDescription className="text-center">We've sent a verification email to your inbox</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please check your email inbox and click on the verification link to complete your registration.
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>
              If you don't see the email, please check your spam folder. The verification link will expire after 24
              hours.
            </p>
          </div>
          <div className="flex flex-col space-y-3 pt-4">
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">Return to sign in</Link>
            </Button>
            <div className="text-center text-sm text-gray-500">
              <p>
                Need help?{" "}
                <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
