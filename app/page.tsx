import { getServerSession } from "@/lib/server-auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Page() {
  const session = await getServerSession()

  if (session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Wellness Dashboard</h1>
        <p className="mb-4">You are signed in as {session.user.email}</p>
        <div className="flex gap-4 mt-6">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">View Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Wellness Dashboard</h1>
      <p className="mb-4">Please sign in to access your dashboard</p>
      <div className="flex gap-4 mt-6">
        <Button asChild>
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}
