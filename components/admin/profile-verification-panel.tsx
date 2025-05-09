"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, UserCheck } from "lucide-react"
import { verifyUserProfile, repairAllProfiles } from "@/utils/profile-verification"

export function ProfileVerificationPanel() {
  const { user, profile } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    exists: boolean
    created: boolean
    error: Error | null
  } | null>(null)
  const [repairResult, setRepairResult] = useState<{
    success: boolean
    results: any[]
    error: Error | null
  } | null>(null)
  const [profileCount, setProfileCount] = useState<number | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(false)

  // Verify current user's profile on mount
  useEffect(() => {
    if (user && !verificationResult) {
      verifyCurrentUserProfile()
    }
  }, [user])

  // Load profile count on mount
  useEffect(() => {
    loadProfileCount()
  }, [])

  const verifyCurrentUserProfile = async () => {
    if (!user) return

    setIsVerifying(true)
    try {
      const result = await verifyUserProfile(user.id)
      setVerificationResult(result)
    } catch (error) {
      console.error("Error verifying profile:", error)
    } finally {
      setIsVerifying(false)
    }
  }

  const repairProfiles = async () => {
    setIsRepairing(true)
    setRepairResult(null)

    try {
      const result = await repairAllProfiles()
      setRepairResult(result)

      // Refresh profile count after repair
      await loadProfileCount()
    } catch (error) {
      console.error("Error repairing profiles:", error)
    } finally {
      setIsRepairing(false)
    }
  }

  const loadProfileCount = async () => {
    setIsLoadingCount(true)

    try {
      const response = await fetch("/api/verify-profiles")

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProfileCount(data.count)
        }
      }
    } catch (error) {
      console.error("Error loading profile count:", error)
    } finally {
      setIsLoadingCount(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Profile Verification System
        </CardTitle>
        <CardDescription>Verify and repair user profiles in the database</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current user profile status */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Your Profile Status</h3>

          {profile ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Profile exists and is valid</span>
            </div>
          ) : verificationResult?.exists ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Profile exists</span>
            </div>
          ) : verificationResult?.created ? (
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle className="h-5 w-5" />
              <span>Profile was created during verification</span>
            </div>
          ) : verificationResult?.error ? (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verification Error</AlertTitle>
              <AlertDescription>{verificationResult.error.message}</AlertDescription>
            </Alert>
          ) : isVerifying ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying profile...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Profile status unknown</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={verifyCurrentUserProfile}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verify Again
              </>
            )}
          </Button>
        </div>

        {/* Database profile stats */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Database Profile Stats</h3>

          <div className="flex items-center gap-2">
            <span className="font-medium">Total Profiles:</span>
            {isLoadingCount ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : profileCount !== null ? (
              <Badge variant="secondary">{profileCount}</Badge>
            ) : (
              <span className="text-gray-500">Unknown</span>
            )}

            <Button variant="ghost" size="sm" className="ml-2" onClick={loadProfileCount} disabled={isLoadingCount}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Repair section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Profile Repair
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            This will check for users without profiles and create them automatically. Use this if you suspect some users
            are missing profiles.
          </p>

          {repairResult?.success ? (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Repair Successful</AlertTitle>
              <AlertDescription>
                {repairResult.results.length > 0
                  ? `${repairResult.results.length} profiles were repaired.`
                  : "Repair process completed. No issues found."}
              </AlertDescription>
            </Alert>
          ) : repairResult?.error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Repair Failed</AlertTitle>
              <AlertDescription>{repairResult.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button variant="default" onClick={repairProfiles} disabled={isRepairing}>
            {isRepairing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Repairing Profiles...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Repair Missing Profiles
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">Last checked: {new Date().toLocaleTimeString()}</p>
      </CardFooter>
    </Card>
  )
}
