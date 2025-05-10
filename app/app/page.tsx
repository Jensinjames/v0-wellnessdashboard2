import { Suspense } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { LoadingSpinner } from "@/components/ui/loading-spinner" // Assuming you have this component

export default function AppPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute fallback={<LoadingSpinner />}>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">App Dashboard</h1>
          <p>This is a protected page that requires authentication.</p>
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            You are successfully authenticated and can access the app section!
          </div>
        </div>
      </ProtectedRoute>
    </Suspense>
  )
}
