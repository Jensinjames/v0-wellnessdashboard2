import { AuthLayout } from "@/components/auth/auth-layout"
import SignUpClient from "./client"

// Add config to disable static generation
export const dynamic = "force-dynamic"

export default function SignUpPage() {
  return (
    <AuthLayout title="Create an account" redirectIfAuthenticated={true} redirectPath="/dashboard">
      <SignUpClient />
    </AuthLayout>
  )
}
