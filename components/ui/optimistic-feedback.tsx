"use client"

import { useState, useEffect } from "react"
import { getOptimisticUpdates } from "@/lib/optimistic-updates"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type OptimisticFeedbackProps = {
  table: string
  showProgress?: boolean
  autoHideDelay?: number
  showRetry?: boolean
  onRetry?: (failedIds: string[]) => void
}

export function OptimisticFeedback({
  table,
  showProgress = true,
  autoHideDelay = 3000,
  showRetry = true,
  onRetry,
}: OptimisticFeedbackProps) {
  const [updates, setUpdates] = useState<any[]>([])
  const [visible, setVisible] = useState(false)
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const optimistic = getOptimisticUpdates()

    const updateListener = () => {
      const tableUpdates = optimistic.getUpdatesForTable(table)
      setUpdates(tableUpdates)

      // Show the feedback if there are any updates
      if (tableUpdates.length > 0) {
        setVisible(true)

        // Clear any existing timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout)
          setHideTimeout(null)
        }

        // If all updates are confirmed or failed, set a timeout to hide the feedback
        const allSettled = tableUpdates.every((update) => update.status === "confirmed" || update.status === "failed")

        if (allSettled) {
          const timeout = setTimeout(() => {
            setVisible(false)
          }, autoHideDelay)

          setHideTimeout(timeout)
        }
      } else {
        // No updates, hide the feedback
        setVisible(false)
      }
    }

    // Initial check
    updateListener()

    // Add listener
    optimistic.addListener(updateListener)

    return () => {
      optimistic.removeListener(updateListener)
      if (hideTimeout) {
        clearTimeout(hideTimeout)
      }
    }
  }, [table, autoHideDelay, hideTimeout])

  // Don't render anything if not visible
  if (!visible) {
    return null
  }

  const pendingCount = updates.filter((u) => u.status === "pending").length
  const confirmedCount = updates.filter((u) => u.status === "confirmed").length
  const failedCount = updates.filter((u) => u.status === "failed").length
  const totalCount = updates.length

  const progress = totalCount > 0 ? ((confirmedCount + failedCount) / totalCount) * 100 : 0

  // Get failed update IDs for retry
  const failedIds = updates.filter((u) => u.status === "failed").map((u) => u.id)

  // Determine the alert variant and message
  let variant = "default"
  let title = "Updating..."
  let icon = <RefreshCw className="h-4 w-4 animate-spin" />

  if (pendingCount === 0) {
    if (failedCount > 0) {
      variant = "destructive"
      title = failedCount === 1 ? "1 operation failed" : `${failedCount} operations failed`
      icon = <AlertCircle className="h-4 w-4" />
    } else {
      variant = "default"
      title = confirmedCount === 1 ? "Operation completed" : `${confirmedCount} operations completed`
      icon = <CheckCircle className="h-4 w-4" />
    }
  } else {
    variant = "default"
    title = pendingCount === 1 ? "1 operation in progress" : `${pendingCount} operations in progress`
    icon = <Clock className="h-4 w-4" />
  }

  return (
    <Alert variant={variant} className="mb-4">
      <div className="flex items-center">
        {icon}
        <AlertTitle className="ml-2">{title}</AlertTitle>
      </div>

      {showProgress && totalCount > 0 && (
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs mt-1">
            <span>{confirmedCount} completed</span>
            {pendingCount > 0 && <span>{pendingCount} pending</span>}
            {failedCount > 0 && <span className="text-red-500">{failedCount} failed</span>}
          </div>
        </div>
      )}

      {showRetry && failedCount > 0 && onRetry && (
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={() => onRetry(failedIds)} className="text-xs">
            Retry Failed Operations
          </Button>
        </div>
      )}
    </Alert>
  )
}
