"use client"

import type { ReactNode } from "react"
import type { ClientSafeProps } from "@/utils/component-boundary"

// This component acts as a clear boundary between server and client rendering
// It should be used whenever you need to wrap client components from a server component

interface ClientBoundaryProps<T = any> {
  children: ReactNode
  data?: ClientSafeProps<T>
  fallback?: ReactNode
}

export function ClientBoundary({ children, fallback = null }: ClientBoundaryProps) {
  return <>{children}</>
}
