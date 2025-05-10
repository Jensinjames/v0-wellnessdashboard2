import { EmailVerification } from "@/components/profile/email-verification"
import { PhoneVerification } from "@/components/profile/phone-verification"

export default function VerificationPage() {
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">Account Verification</h1>

      <div className="space-y-6">
        <EmailVerification />
        <PhoneVerification />
      </div>
    </div>
  )
}
