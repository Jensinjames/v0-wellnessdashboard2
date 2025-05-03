import { Loader2 } from "lucide-react"
import { useOptimisticUpdatesContext } from "@/context/optimistic-updates-context"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function PendingOperationsIndicator() {
  const { pendingOperations } = useOptimisticUpdatesContext()

  // Count pending operations
  const pendingCount = pendingOperations.filter((op) => op.status === "pending").length

  if (pendingCount === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Badge variant="outline" className="gap-1 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{pendingCount} pending</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold mb-1">Pending Operations:</p>
            <ul className="space-y-1">
              {pendingOperations
                .filter((op) => op.status === "pending")
                .map((op) => (
                  <li key={op.id}>
                    {op.type === "create" && `Creating ${op.entityType}`}
                    {op.type === "update" && `Updating ${op.entityType}`}
                    {op.type === "delete" && `Deleting ${op.entityType}`}
                  </li>
                ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
