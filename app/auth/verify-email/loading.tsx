import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFormLoading } from "@/components/auth/auth-layout"

export default function VerifyEmailLoading() {
  return (
    <AuthLayout>
      <AuthFormLoading />
    </AuthLayout>
  )
}
