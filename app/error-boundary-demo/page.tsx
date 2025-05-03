import { ErrorBoundaryDemo } from "@/components/error-boundary/error-demo"
import { CriticalErrorBoundary } from "@/components/error-boundary/specialized-boundaries"

export default function ErrorBoundaryDemoPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Error Boundary Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how error boundaries can be used to catch and handle runtime errors gracefully.
      </p>

      {/* Wrap the entire demo in a critical error boundary */}
      <CriticalErrorBoundary>
        <ErrorBoundaryDemo />
      </CriticalErrorBoundary>
    </div>
  )
}
