"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getVerificationTokenForTesting,
  setVerificationStatusForTesting,
  resetVerificationForTesting,
} from "@/utils/verification-test-utils"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function VerificationTestPanel() {
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")

  if (!user || process.env.NODE_ENV === "production") {
    return null
  }

  const handleGetToken = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getVerificationTokenForTesting(user.id)
      if (result.error) {
        setError(result.error.message)
      } else {
        setResult(result)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetVerificationStatus = async (type: "email" | "phone", verified: boolean) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await setVerificationStatusForTesting(user.id, type, verified)
      if (result.error) {
        setError(result.error.message)
      } else {
        setResult({ success: result.success, type, verified })
        await refreshProfile()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetVerification = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await resetVerificationForTesting(user.id)
      if (result.error) {
        setError(result.error.message)
      } else {
        setResult({ success: result.success, message: "Verification reset successful" })
        await refreshProfile()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePhone = async () => {
    if (!phoneNumber) return

    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from("profiles")
        .update({ phone: phoneNumber, phone_verified: false })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
      } else {
        setResult({ success: true, message: "Phone number updated" })
        await refreshProfile()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-8 border-dashed border-orange-300 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Verification Test Panel</CardTitle>
        <CardDescription className="text-orange-700">
          Development tools for testing verification. Do not use in production.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="mb-4">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="token">Token</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status:</p>
                <p className="text-sm">{profile?.email_verified ? "Verified" : "Not Verified"}</p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleSetVerificationStatus("email", true)}
                  disabled={isLoading}
                >
                  Set Verified
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSetVerificationStatus("email", false)}
                  disabled={isLoading}
                >
                  Set Unverified
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status:</p>
                <p className="text-sm">{profile?.phone_verified ? "Verified" : "Not Verified"}</p>
                <p className="text-sm font-medium mt-2">Current Phone:</p>
                <p className="text-sm">{profile?.phone || "None"}</p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleSetVerificationStatus("phone", true)}
                  disabled={isLoading || !profile?.phone}
                >
                  Set Verified
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSetVerificationStatus("phone", false)}
                  disabled={isLoading || !profile?.phone}
                >
                  Set Unverified
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="phone-number">Test Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone-number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter test phone number"
                />
                <Button onClick={handleUpdatePhone} disabled={isLoading || !phoneNumber}>
                  Update
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="token" className="space-y-4">
            <Button onClick={handleGetToken} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Get Current Token"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="reset" className="space-y-4">
            <p className="text-sm text-orange-700 mb-4">
              This will reset all verification statuses and tokens for the current user.
            </p>
            <Button variant="destructive" onClick={handleResetVerification} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset All Verification"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !error && (
          <div className="mt-4 rounded-md bg-green-50 p-4 border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">Result:</h3>
            <pre className="text-xs text-green-700 overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-orange-600">
        Note: These tools are for development and testing only.
      </CardFooter>
    </Card>
  )
}
