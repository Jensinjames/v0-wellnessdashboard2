import Link from "next/link"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Wellness Dashboard</h1>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Your Wellness Journey</h2>
          <p className="mb-4">
            Track your activities, monitor your progress, and achieve your wellness goals with our comprehensive
            dashboard.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Go to Dashboard
            </Link>
            <Link href="/activity" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Track Activity
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Activity Tracking</h3>
            <p className="mb-3">Log your daily activities and monitor your progress over time.</p>
            <Link href="/activity" className="text-blue-600 hover:underline">
              Start tracking →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Wellness Insights</h3>
            <p className="mb-3">Gain valuable insights into your wellness journey with detailed analytics.</p>
            <Link href="/insights" className="text-blue-600 hover:underline">
              View insights →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
