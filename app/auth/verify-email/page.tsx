import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We've sent a verification link to your email address.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Please check your email and click the verification link to complete your registration.
          </p>
          <p className="text-muted-foreground">If you don't see the email, check your spam folder.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/sign-in">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
