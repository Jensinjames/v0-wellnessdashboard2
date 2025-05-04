"use client"

import { useMediaQuery } from "@/hooks/use-media-query"

export function useMobileDetection() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const isPortrait = useMediaQuery("(orientation: portrait)")

  return { isMobile, isSmallMobile, isPortrait }
}
