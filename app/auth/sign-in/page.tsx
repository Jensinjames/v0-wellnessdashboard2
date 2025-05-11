import { Suspense } from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function SignInPage() {
  return (
    <main
      id="main-content"
      aria-labelledby="sign-in-heading"
      className="flex min-h-screen flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 id="sign-in-heading" className="text-2xl font-bold">
            Sign In
          </h1>
          <p className="mt-2 text-gray-600">Enter your credentials to access your account</p>
        </div>
        <Suspense fallback={<SignInFormSkeleton />}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  )
}

function SignInFormSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading sign-in form">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  )
}
