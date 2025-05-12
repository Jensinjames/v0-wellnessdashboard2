import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-white p-4 text-center">
      <div className="max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-blue-600">Rollen Wellness</span>
        </h1>

        <p className="mb-8 text-xl text-gray-600">
          Track your wellness journey, set goals, and maintain balance across all aspects of your life.
        </p>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/login">Sign In</Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Link href="/auth/register">Create Account</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard title="Faith" description="Track spiritual practices and growth" />
        <FeatureCard title="Life" description="Balance personal relationships and activities" />
        <FeatureCard title="Work" description="Monitor productivity and career goals" />
        <FeatureCard title="Health" description="Maintain physical and mental wellbeing" />
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 text-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
