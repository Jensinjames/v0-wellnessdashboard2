import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main
      id="main-content"
      aria-labelledby="welcome-heading"
      className="flex min-h-screen flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 id="welcome-heading" className="text-3xl font-bold">
            Rollen Wellness
          </h1>
          <p className="mt-2 text-gray-600">Track your wellness journey across Faith, Life, Work, and Health</p>
        </div>
        <div className="space-y-4">
          <Link href="/auth/sign-in" className="w-full">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up" className="w-full">
            <Button variant="outline" className="w-full">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
