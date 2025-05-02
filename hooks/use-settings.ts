import { useSettings as useSettingsContext } from "@/context/settings-context"

export function useSettings() {
  return useSettingsContext()
}
