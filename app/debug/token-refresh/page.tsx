import { TokenRefreshTester } from "@/components/debug/token-refresh-tester"

export default function TokenRefreshTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Token Refresh Testing</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to test the token refresh functionality in your application. Use the controls below to
        manually refresh tokens, simulate expiration, and monitor token status.
      </p>

      <div className="grid gap-6">
        <TokenRefreshTester />
      </div>
    </div>
  )
}
