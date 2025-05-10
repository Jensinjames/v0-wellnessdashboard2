import { SessionStatus } from "@/components/debug/session-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthStatusPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Status</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <SessionStatus />

        <Card>
          <CardHeader>
            <CardTitle>Authentication Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Session Expired</h3>
              <p className="text-sm text-gray-500">
                If your session has expired, click the "Refresh Session" button or sign in again.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Email Verification</h3>
              <p className="text-sm text-gray-500">
                If you're having trouble signing in, make sure your email is verified. Check your inbox for a
                verification link.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Browser Storage</h3>
              <p className="text-sm text-gray-500">
                Authentication uses browser storage. If you're having issues, try clearing your browser cache and
                cookies.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Network Issues</h3>
              <p className="text-sm text-gray-500">
                Authentication requires a stable internet connection. Check your network if you're having trouble.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
