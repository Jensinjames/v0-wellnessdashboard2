"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

export function AuthDebugger() {
  const { user, session, refreshProfile } = useAuth()
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getClientInfo() {
      try {
        const client = await getSupabaseClient()
        setClientInfo({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasClient: !!client,
          authConfigured: !!(client && (client as any).auth),
        })
      } catch (err: any) {
        setError(err.message)
      }
    }

    getClientInfo()
  }, [])

  const checkSession = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const client = await getSupabaseClient()
      const { data, error } = await client.auth.getSession()

      if (error) {
        setError(error.message)
        return
      }

      setSessionInfo({
        hasSession: !!data.session,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        user: data.session?.user
          ? {
              id: data.session.user.id,
              email: data.session.user.email,
              emailConfirmed: !!data.session.user.email_confirmed_at,
              confirmedAt: data.session.user.email_confirmed_at,
            }
          : null,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
        <CardDescription>Diagnose authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="bg-red-50 p-3 rounded text-red-700 text-sm mb-4">Error: {error}</div>}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Auth Context State</h3>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(
              {
                isAuthenticated: !!user,
                userId: user?.id,
                userEmail: user?.email,
                hasSession: !!session,
                sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
              },
              null,
              2,
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Supabase Client</h3>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(clientInfo, null, 2)}
          </div>
        </div>

        {sessionInfo && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Session Check Result</h3>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(sessionInfo, null, 2)}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={checkSession} disabled={isLoading}>
            {isLoading ? "Checking..." : "Check Session"}
          </Button>
          <Button onClick={() => refreshProfile()} variant="outline">
            Refresh Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
