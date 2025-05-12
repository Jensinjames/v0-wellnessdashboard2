"use client"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUniqueId } from "@/utils/unique-id"

export function MobileNav() {
  const isMobile = useIsMobile()
  const navId = useUniqueId("mobile-nav")

  // We no longer need the mobile nav since we have the navigation header with mobile menu
  return null
}
