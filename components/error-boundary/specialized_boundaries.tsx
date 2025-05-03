"use client"

import { ErrorBoundary } from "./error-boundary"
import {
  DataErrorFallback,
  FormErrorFallback,
  RenderErrorFallback,
  CriticalErrorFallback,
  CompactErrorFallback,
} from "./fallbacks"
import type { ReactNode, ErrorInfo } from "react"
import { reportError } from "@/lib/error-reporting"

interface ErrorBoundaryWrapperProps {
  children: ReactNode
  resetKeys?: any[]
}

/**
 * Error boundary specifically for data fetching components.
 */
export function DataErrorBoundary({ children, resetKeys }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={<DataErrorFallback />}
      onError={(error, errorInfo) => reportError("data_fetch_error", error, errorInfo)}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error boundary specifically for form components.
 */
export function FormErrorBoundary({ children, resetKeys }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={<FormErrorFallback />}
      onError={(error, errorInfo) => reportError("form_error", error, errorInfo)}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error boundary specifically for UI rendering components.
 */
export function RenderErrorBoundary({ children, resetKeys }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={<RenderErrorFallback />}
      onError={(error, errorInfo) => reportError("render_error", error, errorInfo)}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error boundary for critical application components.
 */
export function CriticalErrorBoundary({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={<CriticalErrorFallback />}
      onError={(error, errorInfo) => reportError("critical_error", error, errorInfo, true)}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Compact error boundary for smaller UI components.
 */
export function CompactErrorBoundary({ children, resetKeys }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={<CompactErrorFallback />}
      onError={(error, errorInfo) => reportError("ui_component_error", error, errorInfo)}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error boundary with custom fallback component.
 */
export function CustomErrorBoundary({
  children,
  fallback,
  onError,
  resetKeys,
}: ErrorBoundaryWrapperProps & {
  fallback: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError} resetKeys={resetKeys}>
      {children}
    </ErrorBoundary>
  )
}
