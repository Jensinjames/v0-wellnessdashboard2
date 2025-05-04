import type React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FormLoadingButtonProps {
  isLoading: boolean
  loadingText: string
  children: React.ReactNode
  type?: "submit" | "button" | "reset"
  className?: string
}

export function FormLoadingButton({
  isLoading,
  loadingText,
  children,
  type = "submit",
  className = "w-full",
}: FormLoadingButtonProps) {
  return (
    <Button type={type} className={className} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
