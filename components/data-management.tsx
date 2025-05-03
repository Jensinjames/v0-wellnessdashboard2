"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  runSchemaMigrations,
  getCurrentSchemaVersion,
  getMigrationHistory,
  exportWellnessData,
  importWellnessData,
} from "@/utils/schema-versioning"
import { checkDataIntegrity, fixDataIntegrityIssues, type IntegrityCheckResult } from "@/utils/data-integrity"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Download, Upload, RefreshCw, Shield } from "lucide-react"

export function DataManagement() {
  const [schemaVersion, setSchemaVersion] = useState<number>(0)
  const [migrationHistory, setMigrationHistory] = useState<any[]>([])
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    setSchemaVersion(getCurrentSchemaVersion())
    setMigrationHistory(getMigrationHistory())
  }, [])

  const handleCheckIntegrity = () => {
    setIsChecking(true)

    try {
      const result = checkDataIntegrity()
      setIntegrityResult(result)

      if (result.isValid) {
        toast({
          title: "Data Integrity Check",
          description: "No issues found. Your data is valid.",
        })
      } else {
        toast({
          title: "Data Integrity Issues",
          description: `Found ${result.issues.length} issues with your data.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking data integrity:", error)
      toast({
        title: "Error",
        description: "Failed to check data integrity.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleFixIssues = () => {
    setIsFixing(true)

    try {
      const success = fixDataIntegrityIssues()

      if (success) {
        // Re-check integrity after fixing
        const result = checkDataIntegrity()
        setIntegrityResult(result)
      }
    } catch (error) {
      console.error("Error fixing data integrity issues:", error)
      toast({
        title: "Error",
        description: "Failed to fix data integrity issues.",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const handleRunMigrations = () => {
    setIsMigrating(true)

    try {
      const success = runSchemaMigrations()

      if (success) {
        setSchemaVersion(getCurrentSchemaVersion())
        setMigrationHistory(getMigrationHistory())
      }
    } catch (error) {
      console.error("Error running migrations:", error)
      toast({
        title: "Migration Error",
        description: "Failed to run schema migrations.",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const handleExportData = () => {
    try {
      const jsonData = exportWellnessData()

      if (jsonData) {
        // Create a download link
        const blob = new Blob([jsonData], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `wellness-data-export-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()

        // Clean up
        URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Your wellness data has been exported successfully.",
        })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Error",
        description: "Failed to export wellness data.",
        variant: "destructive",
      })
    }
  }

  const handleImportData = () => {
    try {
      // Create a file input element
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "application/json"

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const reader = new FileReader()

        reader.onload = (event) => {
          const jsonData = event.target?.result as string
          if (jsonData) {
            const success = importWellnessData(jsonData)

            if (success) {
              // Update schema version and migration history
              setSchemaVersion(getCurrentSchemaVersion())
              setMigrationHistory(getMigrationHistory())

              // Re-check integrity after import
              handleCheckIntegrity()
            }
          }
        }

        reader.readAsText(file)
      }

      input.click()
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Import Error",
        description: "Failed to import wellness data.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Schema Management</CardTitle>
          <CardDescription>Manage your data schema versions and migrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Schema Version</p>
                <p className="text-2xl font-bold">{schemaVersion}</p>
              </div>
              <Button onClick={handleRunMigrations} disabled={isMigrating}>
                {isMigrating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Migrations
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Migration History</h3>
              {migrationHistory.length > 0 ? (
                <div className="space-y-2">
                  {migrationHistory.map((migration, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">Version {migration.version}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(migration.appliedAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={migration.success ? "default" : "destructive"}>
                        {migration.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No migrations have been applied yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Integrity</CardTitle>
          <CardDescription>Check and fix data integrity issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Data Status</p>
                {integrityResult ? (
                  <div className="flex items-center mt-1">
                    {integrityResult.isValid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium text-green-500">Valid</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-red-500">{integrityResult.issues.length} issues found</span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Not checked yet</p>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleCheckIntegrity} disabled={isChecking}>
                  {isChecking ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Check Integrity
                    </>
                  )}
                </Button>

                {integrityResult && !integrityResult.isValid && (
                  <Button onClick={handleFixIssues} disabled={isFixing}>
                    {isFixing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      "Fix Issues"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {integrityResult && integrityResult.issues.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">Issues Found</h3>
                {integrityResult.issues.map((issue, index) => (
                  <Alert key={index} variant={issue.type === "error" ? "destructive" : "default"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {issue.entity.charAt(0).toUpperCase() + issue.entity.slice(1)} Issue
                      {issue.id && ` (ID: ${issue.id.substring(0, 8)}...)`}
                    </AlertTitle>
                    <AlertDescription>{issue.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Restore</CardTitle>
          <CardDescription>Export and import your wellness data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button className="flex-1" variant="outline" onClick={handleImportData}>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Exporting creates a backup of all your wellness data. You can import this backup later to restore your data.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
