import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export default function AuthStatus({ user, profile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
        <CardDescription>Your current authentication information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1">{user?.email}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Email Verification</h3>
          <div className="mt-1">
            {profile?.email_verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="destructive">Not Verified</Badge>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Last Sign In</h3>
          <p className="mt-1">
            {profile?.last_sign_in_at
              ? formatDistanceToNow(new Date(profile.last_sign_in_at), { addSuffix: true })
              : "Never"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Login Count</h3>
          <p className="mt-1">{profile?.login_count || 0} times</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
          <p className="mt-1">
            {profile?.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : "Unknown"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
