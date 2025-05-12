"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RealtimeStatusProps {
  isConnected: boolean
  className?: string
}

export function RealtimeStatus({ isConnected, className }: RealtimeStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Only show tooltip after a delay to avoid flickering during initial connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!showTooltip) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isConnected ? "text-green-500" : "text-red-500",
              className,
            )}
            aria-label={isConnected ? "Real-time updates connected" : "Real-time updates disconnected"}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="sr-only md:not-sr-only">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span className="sr-only md:not-sr-only">Offline</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isConnected
            ? "Real-time updates are active"
            : "Real-time updates are disconnected. Data may not be current."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
