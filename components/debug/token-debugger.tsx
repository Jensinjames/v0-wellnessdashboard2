"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { extractAuthToken } from "@/utils/auth-redirect"

export function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<{
    rawToken: string | null
    tokenPrefix: string | null
    tokenLength: number | null
    urlParams: Record<string, string>
    currentUrl: string
  }>({
    rawToken: null,
    tokenPrefix: null,
    tokenLength: null,
    urlParams: {},
    currentUrl: "",
  })

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return

    // Get the current URL
    const currentUrl = window.location.href

    // Extract token
    const token = extractAuthToken(currentUrl)

    // Get all URL parameters
    const urlParams: Record<string, string> = {}
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.forEach((value, key) => {
      urlParams[key] = value
    })

    setTokenInfo({
      rawToken: token,
      tokenPrefix: token ? `${token.substring(0, 8)}...` : null,
      tokenLength: token ? token.length : null,
      urlParams,
      currentUrl,
    })
  }, [])

  const clearToken = () => {
    // Remove the token from the URL without reloading the page
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("__v0_token")
      window.history.replaceState({}, document.title, url.toString())

      // Update the state
      setTokenInfo((prev) => ({
        ...prev,
        rawToken: null,
        tokenPrefix: null,
        tokenLength: null,
        currentUrl: url.toString(),
      }))
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Authentication Token Debugger</CardTitle>
        <CardDescription>Analyzing authentication token parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-semibold">Token present:</div>
          <div className={tokenInfo.rawToken ? "text-green-600" : "text-red-600"}>
            {tokenInfo.rawToken ? "Yes" : "No"}
          </div>

          {tokenInfo.tokenPrefix && (
            <>
              <div className="font-semibold">Token prefix:</div>
              <div className="font-mono">{tokenInfo.tokenPrefix}</div>

              <div className="font-semibold">Token length:</div>
              <div>{tokenInfo.tokenLength} characters</div>
            </>
          )}

          <div className="font-semibold">Current URL:</div>
          <div className="font-mono text-xs break-all">{tokenInfo.currentUrl}</div>
        </div>

        {tokenInfo.rawToken && (
          <Button variant="outline" size="sm" onClick={clearToken} className="mt-2">
            Clear Token from URL
          </Button>
        )}

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">All URL Parameters:</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(tokenInfo.urlParams, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
