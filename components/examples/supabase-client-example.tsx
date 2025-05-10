"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, WifiOff, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SupabaseClientExample() {
  const { supabase, isConnected, lastConnectionCheck, query, forceConnectionCheck } = useSupabaseClient()
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await query((client) => client.from("wellness_categories").select("*").limit(5))

    if (error) {
      setError(error.message)
    } else {
      setCategories(data || [])
    }

    setIsLoading(false)
  }

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true)
    await forceConnectionCheck()
    setIsCheckingConnection(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Supabase Client Example</CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
            {isConnected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>
          {lastConnectionCheck
            ? `Last checked: ${lastConnectionCheck.toLocaleTimeString()}`
            : "Connection not yet checked"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert variant="destructive">
            <AlertDescription>
              Database connection is currently unavailable. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Categories ({categories.length})</h3>
            {categories.length > 0 ? (
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category.id} className="text-sm flex items-center">
                    <span
                      className="inline-block h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    {category.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleCheckConnection} disabled={isCheckingConnection}>
          {isCheckingConnection ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Check Connection
            </>
          )}
        </Button>

        <Button variant="default" size="sm" onClick={fetchCategories} disabled={isLoading || !isConnected}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            "Refresh Data"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
