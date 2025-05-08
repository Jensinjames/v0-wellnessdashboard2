"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SQLExecutorComponent")

export function SQLExecutor() {
  const [sql, setSql] = useState("")
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    data?: any
    error?: string
  } | null>(null)

  // Function to execute SQL
  const executeSql = async () => {
    if (!sql.trim()) return

    setExecuting(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          data: data.data,
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Unknown error",
        })
      }
    } catch (error) {
      logger.error("Error executing SQL:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SQL Executor</CardTitle>
        <CardDescription>Execute SQL statements directly against the database</CardDescription>
      </CardHeader>

      <CardContent>
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter SQL statement..."
          className="font-mono h-32 mb-4"
        />

        {result && (
          <div className="mt-4">
            {result.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">SQL Executed Successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  <pre className="mt-2 bg-green-100 p-2 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">SQL Execution Failed</AlertTitle>
                <AlertDescription className="text-red-700">{result.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={executeSql} disabled={executing || !sql.trim()} className={executing ? "opacity-80" : ""}>
          {executing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          {executing ? "Executing..." : "Execute SQL"}
        </Button>
      </CardFooter>
    </Card>
  )
}
