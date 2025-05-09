"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DebugInfo = {
  rawRedirectTo: string | null
  decodedPath: string
  isValid: boolean
  storedPath: string | null
  urlParams: Record<string, string>
  currentUrl: string
}

export function RedirectDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    rawRedirectTo: null,
    decodedPath: "",
    isValid: false,
    storedPath: null,
    urlParams: {},
    currentUrl: "",
  })

  const searchParams = useSearchParams()

  // Run once on mount and when searchParams changes
  useEffect(() => {
    // Get the current URL once
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""

    // Get the raw redirectTo parameter
    const rawRedirectTo = searchParams?.get("redirectTo")

    // Simple decode (don't call external function to avoid potential side effects)
    const decodedPath = rawRedirectTo ? decodeURIComponent(rawRedirectTo) : ""

    // Simple validation (don't call external function)
    const isValid = decodedPath.startsWith("/")

    // Get the stored redirect path
    const storedPath = typeof window !== "undefined" ? sessionStorage.getItem("authRedirectPath") : null

    // Get all URL parameters
    const urlParams: Record<string, string> = {}
    if (searchParams) {
      // Convert to regular object to avoid potential reference issues
      searchParams.forEach((value, key) => {
        urlParams[key] = value
      })
    }

    // Update state once with all values
    setDebugInfo({
      rawRedirectTo,
      decodedPath,
      isValid,
      storedPath,
      urlParams,
      currentUrl,
    })
  }, [searchParams]) // Only depends on searchParams

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Redirect Debugger</CardTitle>
        <CardDescription>Analyzing redirect parameters and paths</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-semibold">Raw redirectTo:</div>
          <div className="font-mono">{debugInfo.rawRedirectTo || "(none)"}</div>

          <div className="font-semibold">Decoded path:</div>
          <div className="font-mono">{debugInfo.decodedPath || "(none)"}</div>

          <div className="font-semibold">Path valid:</div>
          <div className={debugInfo.isValid ? "text-green-600" : "text-red-600"}>
            {debugInfo.isValid ? "Yes" : "No"}
          </div>

          <div className="font-semibold">Stored path:</div>
          <div className="font-mono">{debugInfo.storedPath || "(none)"}</div>

          <div className="font-semibold">Current URL:</div>
          <div className="font-mono text-xs break-all">{debugInfo.currentUrl}</div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">All URL Parameters:</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo.urlParams, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
