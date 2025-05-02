import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ButtonWithLoadingProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function ButtonWithLoading({
  children,
  isLoading = false,
  loadingText = "Loading...",
  disabled,
  ...props
}: ButtonWithLoadingProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
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
