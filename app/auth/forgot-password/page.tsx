import { AuthLayout } from "@/components/auth/auth-layout"
import ForgotPasswordClient from "./client"

// Add config to disable static generation
export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" redirectIfAuthenticated={false}>
      <ForgotPasswordClient />
    </AuthLayout>
  )
}
