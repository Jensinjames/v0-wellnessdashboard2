/**
 * Auth Error Monitor Component
 * Displays recent authentication errors for debugging
 */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthErrorCategory } from "@/utils/auth-error-handler"
import { AlertTriangle, RefreshCw, Trash2, Download } from "lucide-react"

// Type for error log entry
interface ErrorLogEntry {
  id: string
  timestamp: string
  operation: string
  category: AuthErrorCategory
  message: string
  code?: string
  details?: any
}

export function AuthErrorMonitor() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")

  // Simulate loading error logs
  useEffect(() => {
    loadErrorLogs()
  }, [])

  const loadErrorLogs = () => {
    setIsLoading(true)

    // Simulate API call to get error logs
    setTimeout(() => {
      // Mock data - in a real app, this would come from your error logging system
      const mockErrors: ErrorLogEntry[] = [
        {
          id: "err_1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          operation: "sign-in",
          category: AuthErrorCategory.CREDENTIALS,
          message: "Invalid login credentials",
          code: "invalid_credentials",
          details: { attemptCount: 2 },
        },
        {
          id: "err_2",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          operation: "sign-up",
          category: AuthErrorCategory.VALIDATION,
          message: "Email already in use",
          code: "email_in_use",
        },
        {
          id: "err_3",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          operation: "reset-password",
          category: AuthErrorCategory.NETWORK,
          message: "Network error. Please check your internet connection",
          code: "network_error",
        },
      ]

      setErrors(mockErrors)
      setIsLoading(false)
    }, 500)
  }

  const clearErrorLogs = () => {
    setErrors([])
  }

  const downloadErrorLogs = () => {
    const data = JSON.stringify(errors, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auth-errors-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredErrors = activeTab === "all" ? errors : errors.filter((error) => error.category === activeTab)

  const getCategoryColor = (category: AuthErrorCategory) => {
    switch (category) {
      case AuthErrorCategory.NETWORK:
        return "bg-orange-100 text-orange-800"
      case AuthErrorCategory.VALIDATION:
        return "bg-blue-100 text-blue-800"
      case AuthErrorCategory.CREDENTIALS:
        return "bg-red-100 text-red-800"
      case AuthErrorCategory.RATE_LIMIT:
        return "bg-purple-100 text-purple-800"
      case AuthErrorCategory.SERVER:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Authentication Error Monitor
            </CardTitle>
            <CardDescription>Recent authentication errors for debugging</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadErrorLogs} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={clearErrorLogs} disabled={errors.length === 0}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
            <Button variant="outline" size="sm" onClick={downloadErrorLogs} disabled={errors.length === 0}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={AuthErrorCategory.NETWORK}>Network</TabsTrigger>
            <TabsTrigger value={AuthErrorCategory.VALIDATION}>Validation</TabsTrigger>
            <TabsTrigger value={AuthErrorCategory.CREDENTIALS}>Credentials</TabsTrigger>
            <TabsTrigger value={AuthErrorCategory.RATE_LIMIT}>Rate Limit</TabsTrigger>
            <TabsTrigger value={AuthErrorCategory.SERVER}>Server</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab === "all" ? "" : activeTab} errors found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((error) => (
                  <div key={error.id} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{error.message}</div>
                      <Badge className={getCategoryColor(error.category)}>{error.category}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <div>
                        Operation: <span className="font-medium">{error.operation}</span>
                      </div>
                      {error.code && (
                        <div>
                          Code: <span className="font-medium">{error.code}</span>
                        </div>
                      )}
                      <div>
                        Time: <span className="font-medium">{formatTimestamp(error.timestamp)}</span>
                      </div>
                    </div>
                    {error.details && (
                      <div className="mt-2 text-xs bg-gray-100 p-2 rounded font-mono overflow-x-auto">
                        {JSON.stringify(error.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
