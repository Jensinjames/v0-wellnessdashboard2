"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FormLoadingButtonProps {
  isLoading: boolean
  loadingText: string
  children: ReactNode
  type?: "submit" | "button" | "reset"
  className?: string
  onClick?: () => void
}

export function FormLoadingButton({
  isLoading,
  loadingText,
  children,
  type = "submit",
  className = "w-full",
  onClick,
}: FormLoadingButtonProps) {
  return (
    <Button
      type={type}
      className={className}
      disabled={isLoading}
      onClick={onClick}
      aria-busy={isLoading}
      aria-disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">{loadingText}, please wait</span>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
