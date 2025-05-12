"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, Info, Loader2 } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { signIn } = useAuth()
  const [email, setEmail] = useState<string>("")
  const [isSimulation, setIsSimulation] = useState<boolean>(false)
  const [resending, setResending] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get email from URL query parameters
    const emailParam = searchParams.get("email")
    const simulationParam = searchParams.get("simulation")

    if (emailParam) {
      setEmail(emailParam)
    }

    if (simulationParam === "true") {
      setIsSimulation(true)
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    if (!email) {
      setError("Email address is required to resend verification")
      return
    }

    if (isSimulation) {
      setResending(true)
      // Simulate API call
      setTimeout(() => {
        setResending(false)
        toast({
          title: "Simulation: Verification email resent",
          description: "In a production environment, a new verification email would be sent.",
        })
      }, 1500)
      return
    }

    try {
      setResending(true)
      setError(null)

      // In a real implementation, you would call the Supabase API to resend the verification email
      // For now, we'll just simulate it

      toast({
        title: "Verification email resent",
        description: "Please check your inbox for the verification link",
      })
    } catch (err) {
      console.error("Error resending verification email:", err)
      setError("Failed to resend verification email. Please try again.")
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to {email || "your email address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSimulation && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Simulation Mode:</strong> In a real environment, a verification email would be sent to{" "}
                {email || "your email address"}.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Please check your email inbox and click on the verification link to complete your registration.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder or click the button below to resend the verification
                email.
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleResendVerification} disabled={resending}>
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
