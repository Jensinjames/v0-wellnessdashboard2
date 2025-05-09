"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isDebugMode } from "@/lib/env-utils"

export function AuthDebugger() {
  const { user, profile, session, isLoading } = useAuth()

  // Only show in debug mode
  if (!isDebugMode()) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Auth Debug Info
          <Badge variant={isLoading ? "outline" : user ? "success" : "destructive"}>
            {isLoading ? "Loading" : user ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold mb-1">User:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {user ? JSON.stringify(user, null, 2) : "No user"}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Profile:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {profile ? JSON.stringify(profile, null, 2) : "No profile"}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Session:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {session ? JSON.stringify(session, null, 2) : "No session"}
          </pre>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500">
            Auth Provider Status: <span className="font-mono">Loaded</span>
          </p>
          <p className="text-xs text-gray-500">
            Context Path: <span className="font-mono">@/context/auth-context</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
