import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  verified: boolean
  type: "email" | "phone"
  className?: string
}

export function VerificationBadge({ verified, type, className }: VerificationBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        verified
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        className,
      )}
    >
      {verified ? (
        <>
          <CheckCircle className="h-3 w-3" />
          <span>{type === "email" ? "Email" : "Phone"} Verified</span>
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          <span>Not Verified</span>
        </>
      )}
    </div>
  )
}
