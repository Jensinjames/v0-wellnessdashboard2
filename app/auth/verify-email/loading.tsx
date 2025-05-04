import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function VerifyEmailLoading() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}
