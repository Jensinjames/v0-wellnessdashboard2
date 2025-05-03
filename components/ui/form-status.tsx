import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormStatusProps {
  variant: "loading" | "success" | "error"
  message: string
  className?: string
}

export function FormStatus({ variant, message, className }: FormStatusProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-md border",
        {
          "bg-muted border-muted-foreground": variant === "loading",
          "bg-green-50 border-green-200": variant === "success",
          "bg-red-50 border-red-200": variant === "error",
        },
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {variant === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        <p
          className={cn("text-sm", {
            "text-muted-foreground": variant === "loading",
            "text-green-600": variant === "success",
            "text-red-600": variant === "error",
          })}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
