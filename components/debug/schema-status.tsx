"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { checkSchema, checkAndFixSchema, REQUIRED_TABLES, type RequiredTable } from "@/utils/schema-check"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SchemaStatus")

export function SchemaStatus() {
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [schemaValid, setSchemaValid] = useState<boolean | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [tableStatus, setTableStatus] = useState<Record<RequiredTable, boolean>>({} as Record<RequiredTable, boolean>)
  const [fixResults, setFixResults] = useState<{
    fixed: boolean
    fixedTables: string[]
    failedTables: string[]
  } | null>(null)

  // Check schema on component mount
  useEffect(() => {
    checkSchemaStatus()
  }, [])

  // Function to check schema status
  const checkSchemaStatus = async () => {
    setChecking(true)
    setLoading(true)

    try {
      const result = await checkSchema()
      setSchemaValid(result.valid)
      setIssues(result.issues)
      setTableStatus(result.tableStatus)
    } catch (error) {
      logger.error("Error checking schema:", error)
      setSchemaValid(false)
      setIssues([error instanceof Error ? error.message : "Unknown error checking schema"])
    } finally {
      setChecking(false)
      setLoading(false)
    }
  }

  // Function to fix schema issues
  const fixSchemaIssues = async () => {
    setFixing(true)

    try {
      const result = await checkAndFixSchema()
      setFixResults({
        fixed: result.fixed,
        fixedTables: result.fixedTables,
        failedTables: result.failedTables,
      })

      // Refresh schema status after fixing
      await checkSchemaStatus()
    } catch (error) {
      logger.error("Error fixing schema:", error)
      setFixResults({
        fixed: false,
        fixedTables: [],
        failedTables: [],
      })
    } finally {
      setFixing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database Schema Status
          <Button variant="outline" size="sm" onClick={checkSchemaStatus} disabled={checking} className="ml-2">
            <RefreshCw className={`h-4 w-4 mr-1 ${checking ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Check and fix database schema issues</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {schemaValid === true ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Schema Valid</AlertTitle>
                <AlertDescription className="text-green-700">
                  All required database tables are present and accessible.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Schema Issues Detected</AlertTitle>
                <AlertDescription className="text-red-700">
                  {issues.length > 0 ? (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    "Unknown schema issues detected."
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Table Status:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {REQUIRED_TABLES.map((table) => (
                  <div key={table} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">{table}</span>
                    {tableStatus[table] ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Exists
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> Missing
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {fixResults && (
              <div className="mt-6">
                <Alert className={fixResults.fixed ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                  {fixResults.fixed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertTitle className={fixResults.fixed ? "text-green-800" : "text-yellow-800"}>
                    {fixResults.fixed ? "Schema Fixed" : "Partial Fix Applied"}
                  </AlertTitle>
                  <AlertDescription className={fixResults.fixed ? "text-green-700" : "text-yellow-700"}>
                    {fixResults.fixedTables.length > 0 && (
                      <div className="mt-2">
                        <strong>Fixed tables:</strong> {fixResults.fixedTables.join(", ")}
                      </div>
                    )}
                    {fixResults.failedTables.length > 0 && (
                      <div className="mt-2">
                        <strong>Failed tables:</strong> {fixResults.failedTables.join(", ")}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          onClick={fixSchemaIssues}
          disabled={fixing || loading || schemaValid === true}
          className={fixing ? "opacity-80" : ""}
        >
          {fixing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          {fixing ? "Fixing Schema..." : "Fix Schema Issues"}
        </Button>
      </CardFooter>
    </Card>
  )
}
