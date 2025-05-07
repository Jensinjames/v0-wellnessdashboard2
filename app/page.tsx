import Link from "next/link"
import { getServerSession } from "@/lib/server-auth"

export default async function HomePage() {
  const session = await getServerSession()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">Wellness Dashboard</h1>
      <p className="mb-8 max-w-md text-center text-gray-600">
        Track and manage your wellness goals with our comprehensive dashboard.
      </p>

      <div className="flex gap-4">
        {session ? (
          <Link
            href="/dashboard"
            className="rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/auth/sign-in"
              className="rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded border border-gray-300 bg-white px-6 py-3 text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
