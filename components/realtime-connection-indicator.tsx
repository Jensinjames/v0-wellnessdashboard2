"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RealtimeConnectionIndicatorProps {
  className?: string
}

export function RealtimeConnectionIndicator({ className }: RealtimeConnectionIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show after a delay to avoid flickering during initial connection
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    // Set up real-time connection status monitoring
    const supabase = createBrowserClient()

    // Create a channel to monitor connection status
    const channel = supabase.channel("connection_monitor")

    // Handle connection state changes
    channel
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true)
      })
      .on("presence", { event: "join" }, () => {
        setIsConnected(true)
      })
      .on("presence", { event: "leave" }, () => {
        setIsConnected(true) // Still connected, just a presence change
      })
      .on("system", { event: "disconnect" }, () => {
        setIsConnected(false)
      })
      .on("system", { event: "reconnect" }, () => {
        setIsConnected(true)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

    return () => {
      clearTimeout(visibilityTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  if (!isVisible) return null

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
