"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserVerification } from "@/hooks/use-user-verification"
import { CheckCircle, XCircle, RefreshCw, Send, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function EnhancedVerificationUI() {
  const { verificationStatus, isLoading, isVerifying, refreshVerificationStatus, sendEmailVerification } =
    useUserVerification()
  const { user } = useAuth()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial refresh timestamp
    setLastRefresh(new Date())
  }, [])

  const handleRefresh = async () => {
    await refreshVerificationStatus()
    setLastRefresh(new Date())
  }

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <AlertCircle className="h-8 w-8 text-yellow-500 mr-2" />
            <p>Please sign in to view verification status</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Account Verification Status</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <span className="font-medium">Email Verification</span>
              <span className="ml-2 text-sm text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              ) : verificationStatus?.emailVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <span className="font-medium">Phone Verification</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {verificationStatus?.phoneVerified ? "Verified" : "Not verified"}
              </span>
            </div>
            <div className="flex items-center">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              ) : verificationStatus?.phoneVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {!verificationStatus?.emailVerified && (
          <Button onClick={sendEmailVerification} disabled={isVerifying}>
            <Send className="h-4 w-4 mr-2" />
            {isVerifying ? "Sending..." : "Send Verification Email"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
