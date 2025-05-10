"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { isValidRedirectPath } from "@/utils/auth-redirect"
import { getSafeRedirectPath } from "@/utils/redirect-utils"
import { validateAndLogRedirectPath, getSafeRedirectUrl } from "@/utils/debug-redirect"

export function RedirectTester() {
  const [path, setPath] = useState("/")
  const [results, setResults] = useState<Array<{ test: string; result: string; status: "success" | "error" }>>([])

  const runTests = () => {
    const newResults = [
      {
        test: "isValidRedirectPath (auth-redirect.ts)",
        result: String(isValidRedirectPath(path)),
        status: isValidRedirectPath(path) ? "success" : ("error" as const),
      },
      {
        test: "getSafeRedirectPath (redirect-utils.ts)",
        result: getSafeRedirectPath(path),
        status: getSafeRedirectPath(path) !== "/" ? "success" : ("error" as const),
      },
      {
        test: "validateAndLogRedirectPath (debug-redirect.ts)",
        result: String(validateAndLogRedirectPath("RedirectTester", path)),
        status: validateAndLogRedirectPath("RedirectTester", path) ? "success" : ("error" as const),
      },
      {
        test: "getSafeRedirectUrl (debug-redirect.ts)",
        result: getSafeRedirectUrl("RedirectTester", path),
        status: getSafeRedirectUrl("RedirectTester", path) !== "/" ? "success" : ("error" as const),
      },
    ]

    setResults(newResults)

    // Log to console for more detailed debugging
    console.group("Redirect Path Tests")
    console.log("Path:", path)
    newResults.forEach((result) => {
      console.log(`${result.test}: ${result.result} (${result.status})`)
    })
    console.groupEnd()
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Redirect Path Tester</CardTitle>
        <CardDescription>Test how different redirect utilities handle paths</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="Enter a path (e.g. /, /dashboard, etc.)"
          />
          <Button onClick={runTests}>Test</Button>
        </div>

        {results.length > 0 && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Results:</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-mono text-sm">{result.test}</span>
                  <span
                    className={`font-mono text-sm px-2 py-1 rounded ${
                      result.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        Check the console for more detailed debugging information.
      </CardFooter>
    </Card>
  )
}
