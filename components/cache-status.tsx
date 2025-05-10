"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getCacheSize, clearOldCache, isLocalStorageAvailable } from "@/lib/cache-utils"
import { useAuth } from "@/context/auth-context"
import { Trash2, RefreshCw } from "lucide-react"

export function CacheStatus() {
  const [cacheSize, setCacheSize] = useState(0)
  const [maxSize, setMaxSize] = useState(5 * 1024 * 1024) // 5MB default
  const [isSupported, setIsSupported] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const { user } = useAuth()

  // Update cache size periodically
  useEffect(() => {
    // Check if localStorage is available
    const supported = isLocalStorageAvailable()
    setIsSupported(supported)

    if (!supported) return

    // Get initial cache size
    setCacheSize(getCacheSize())

    // Estimate max localStorage size (varies by browser)
    // This is a rough estimate - actual limits vary by browser
    try {
      let testString = ""
      let i = 0
      const increment = 1024 * 100 // 100KB increments

      while (i < 10) {
        // Try up to 10MB
        try {
          testString = "a".repeat(i * increment)
          localStorage.setItem("__size_test__", testString)
          localStorage.removeItem("__size_test__")
          i++
        } catch (e) {
          // We've hit the limit
          setMaxSize(i * increment)
          break
        }
      }

      // If we didn't hit a limit, set a reasonable default
      if (i >= 10) {
        setMaxSize(10 * 1024 * 1024) // 10MB
      }
    } catch (e) {
      // If we can't test, use the default
      setMaxSize(5 * 1024 * 1024) // 5MB
    }

    // Update cache size every 30 seconds
    const interval = setInterval(() => {
      setCacheSize(getCacheSize())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    setIsClearing(true)

    try {
      clearOldCache()
      setCacheSize(getCacheSize())
    } catch (e) {
      console.error("Error clearing cache:", e)
    } finally {
      setIsClearing(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Local storage is not available in your browser. Caching is disabled.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Cache Usage</span>
            <span className="font-medium">
              {formatSize(cacheSize)} / {formatSize(maxSize)}
            </span>
          </div>
          <Progress value={(cacheSize / maxSize) * 100} className="h-2" />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={isClearing || cacheSize === 0}
            className="flex items-center gap-1"
          >
            {isClearing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear Old Cache
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Caching helps reduce API calls and improves performance.</p>
          {user && <p>User ID: {user.id.substring(0, 8)}...</p>}
        </div>
      </CardContent>
    </Card>
  )
}
