import { DebugPanel } from "@/components/debug-panel"

/**
 * Debug Page
 *
 * This page provides debugging tools for the application.
 * It is only accessible in development mode.
 */
export default function DebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Tools</h1>
      <p className="text-muted-foreground mb-8">
        This page provides debugging tools for the application. It is only accessible in development mode.
      </p>

      <DebugPanel />
    </div>
  )
}
