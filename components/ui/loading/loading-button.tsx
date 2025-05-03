import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "./spinner"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  spinnerSize?: "xs" | "sm"
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  spinnerSize = "xs",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <Spinner size={spinnerSize} variant="default" className="mr-2" label={loadingText || "Loading"} />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
