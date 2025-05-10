"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { checkSupabaseEnvVars, validateSupabaseUrl } from "@/utils/env-validator"
import { useEffect, useState } from "react"

export function ConfigurationError() {
  const [envCheck, setEnvCheck] = useState({ valid: true, missing: [], messages: [] })
  const [urlValid, setUrlValid] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = () => {
    setIsChecking(true)

    // Check required environment variables
    const result = checkSupabaseEnvVars()
    setEnvCheck(result)

    // Check if the URL is valid
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    setUrlValid(validateSupabaseUrl(url))

    setIsChecking(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Configuration Error</CardTitle>
          <CardDescription className="text-center">
            There's an issue with your application configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Configuration</AlertTitle>
            <AlertDescription>
              The application cannot connect to the database because required environment variables are missing or
              invalid.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <h3 className="font-medium">Issues Detected:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {!envCheck.valid &&
                envCheck.messages.map((message, i) => (
                  <li key={i} className="text-red-600">
                    {message}
                  </li>
                ))}
              {!urlValid && (
                <li className="text-red-600">
                  Invalid Supabase URL format: {process.env.NEXT_PUBLIC_SUPABASE_URL || "not set"}
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-medium">How to fix:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Make sure you've created a <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file in
                the project root
              </li>
              <li>
                Add your Supabase URL and anonymous key:
                <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{"\n"}
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
                </pre>
              </li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={checkEnvironment} disabled={isChecking}>
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
