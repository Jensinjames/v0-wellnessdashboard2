"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { LoadingOverlay } from "@/components/ui/loading/loading-overlay"
import { DataErrorBoundary } from "@/components/error-boundary/specialized-boundaries"
import { useLoading } from "@/context/loading-context"

interface LoadingErrorBoundaryProps {
  children: React.ReactNode
  loadingKey?: string
  fallback?: React.ReactNode
  loadingMessage?: string
  minLoadingTime?: number
}

export function LoadingErrorBoundary({
  children,
  loadingKey = "global",
  fallback,
  loadingMessage = "Loading...",
  minLoadingTime = 0,
}: LoadingErrorBoundaryProps) {
  const { isLoading } = useLoading()
  const loading = isLoading(loadingKey)
  const [showLoading, setShowLoading] = useState(loading)

  useEffect(() => {
    if (loading) {
      setShowLoading(true)
      return
    }

    // If minLoadingTime is set, we want to show the loading state for at least that amount of time
    if (minLoadingTime > 0) {
      const timer = setTimeout(() => {
        setShowLoading(false)
      }, minLoadingTime)
      return () => clearTimeout(timer)
    }

    setShowLoading(false)
  }, [loading, minLoadingTime])

  return (
    <DataErrorBoundary>
      <LoadingOverlay isLoading={showLoading} message={loadingMessage}>
        {children}
      </LoadingOverlay>
    </DataErrorBoundary>
  )
}
