import { AuthLayout } from "@/components/auth/auth-layout"
import ResetPasswordClient from "./client"

// Fix: Use hyphen instead of underscore in force-dynamic
export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordClient />
    </AuthLayout>
  )
}
