import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "./skeleton"

interface LoadingCardProps {
  hasHeader?: boolean
  hasFooter?: boolean
  lines?: number
  className?: string
}

export function LoadingCard({ hasHeader = true, hasFooter = false, lines = 3, className }: LoadingCardProps) {
  return (
    <Card className={className}>
      {hasHeader && (
        <CardHeader className="gap-2">
          <Skeleton variant="text" className="h-5 w-1/3" />
          <Skeleton variant="text" className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" className={i === lines - 1 ? "w-2/3" : "w-full"} />
        ))}
      </CardContent>
      {hasFooter && (
        <CardFooter className="flex justify-between">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="button" className="w-24" />
        </CardFooter>
      )}
    </Card>
  )
}
