"use client"

import { useEnv } from "@/components/providers/env-provider"

export function VersionInfo() {
  const { appVersion, isDebugMode, enableDebugMode, disableDebugMode } = useEnv()

  // Only show in debug mode
  if (!isDebugMode) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div className="flex flex-col space-y-1">
        <div>Version: {appVersion}</div>
        <div>Debug: {isDebugMode ? "Enabled" : "Disabled"}</div>
        <div className="flex space-x-2 mt-1">
          <button onClick={enableDebugMode} className="px-2 py-1 bg-blue-700 rounded hover:bg-blue-600 text-xs">
            Enable Debug
          </button>
          <button onClick={disableDebugMode} className="px-2 py-1 bg-red-700 rounded hover:bg-red-600 text-xs">
            Disable Debug
          </button>
        </div>
      </div>
    </div>
  )
}
