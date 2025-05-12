import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyEmailLoading() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="text-center">
            <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
