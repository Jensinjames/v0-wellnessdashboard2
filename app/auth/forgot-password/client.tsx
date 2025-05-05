"use client"
import { Card } from "@/components/ui/card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordClient() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <ForgotPasswordForm />
    </Card>
  )
}
