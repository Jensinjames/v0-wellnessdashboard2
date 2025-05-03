"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/hooks/use-supabase"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

interface SessionRefreshProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  autoRefresh?: boolean
}

export function SessionRefresh({ onSuccess, onError, autoRefresh = false }: SessionRefreshProps) {
  const { refreshSession } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      const result = await refreshSession()

      if (result.success) {
        toast({
          title: "Success",
          description: "Your session has been refreshed.",
        })

        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || "Failed to refresh session")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh session"

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto refresh on mount if enabled
  useEffect(() => {
    if (autoRefresh) {
      handleRefresh()
    }
  }, [autoRefresh])

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Session"}
    </Button>
  )
}
