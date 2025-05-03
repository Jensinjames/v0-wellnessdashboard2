import { useMediaQuery } from "./use-media-query"

export function useMobileDetection() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")

  return { isMobile, isSmallMobile }
}
