"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { useCallback } from "react"

interface BackButtonProps extends Omit<ButtonProps, "onClick"> {
  fallbackPath?: string
  onBack?: () => void
}

export function BackButton({
  fallbackPath = "/dashboard",
  onBack,
  children = "Back",
  variant = "outline",
  size = "default",
  className = "",
  ...props
}: BackButtonProps) {
  const { goBack, getPreviousPath } = useNavigation()

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
      return
    }

    goBack()
  }, [goBack, onBack])

  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      onClick={handleBack}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  )
}
