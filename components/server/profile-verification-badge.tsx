import { CheckCircle, AlertCircle } from "lucide-react"

interface VerificationBadgeProps {
  verified: boolean
  type: "email" | "phone" | "identity"
}

export function VerificationBadge({ verified, type }: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {verified ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
      {verified ? "Verified" : "Unverified"}
    </span>
  )
}
