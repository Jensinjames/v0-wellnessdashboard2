import { VerificationTestPanel } from "@/components/debug/verification-test-panel"

export default function VerificationTestPage() {
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">Verification Testing</h1>
      <p className="text-muted-foreground mb-6">
        This page contains tools for testing the verification system. These tools should only be used in development.
      </p>

      <VerificationTestPanel />
    </div>
  )
}
