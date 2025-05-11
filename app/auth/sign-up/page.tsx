import { Suspense } from "react"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign Up</h1>
          <p className="mt-2 text-gray-600">Create your account to get started</p>
        </div>
        <Suspense fallback={<SignUpFormSkeleton />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  )
}

function SignUpFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  )
}
