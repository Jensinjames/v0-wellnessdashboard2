import type React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
  spinnerSize?: "xs" | "sm" | "md" | "lg" | "xl"
  spinnerVariant?: "default" | "primary" | "secondary" | "muted"
  blur?: boolean
  fullScreen?: boolean
}

export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading...",
  className,
  spinnerSize = "md",
  spinnerVariant = "primary",
  blur = true,
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center",
          blur ? "backdrop-blur-sm" : "",
          fullScreen ? "fixed z-50" : "z-10",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
          "transition-opacity duration-300",
          "bg-background/80",
          className,
        )}
        aria-live="polite"
        aria-busy={isLoading}
      >
        <Spinner size={spinnerSize} variant={spinnerVariant} />
        {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        <VisuallyHidden>Loading: {message}</VisuallyHidden>
      </div>
    </div>
  )
}
