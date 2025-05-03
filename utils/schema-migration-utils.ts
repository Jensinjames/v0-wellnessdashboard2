import { toast } from "@/hooks/use-toast"
import { safelyGetFromStorage, safelySetInStorage, STORAGE_KEYS } from "@/utils/storage-utils"

// Schema version tracking
const SCHEMA_VERSION_KEY = "wellness_schema_version"
const CURRENT_SCHEMA_VERSION = 1 // Increment this when making schema changes

// Get current schema version from storage
export function getCurrentSchemaVersion(): number {
  const version = localStorage.getItem(SCHEMA_VERSION_KEY)
  return version ? Number.parseInt(version, 10) : 0
}

// Update schema version in storage
function updateSchemaVersion(version: number): void {
  localStorage.setItem(SCHEMA_VERSION_KEY, version.toString())
}

// Migration from v0 to v1 (example)
function migrateV0ToV1(): boolean {
  try {
    // Example migration: Add 'createdAt' and 'updatedAt' to entries
    const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES)

    if (rawEntries) {
      const entries = JSON.parse(rawEntries) as any[]

      const migratedEntries = entries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
      }))

      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(migratedEntries))
    }

    return true
  } catch (error) {
    console.error("Error during schema migration v0 to v1:", error)
    return false
  }
}

// Execute schema migrations
export function runSchemaMigrations(): boolean {
  const currentVersion = getCurrentSchemaVersion()

  if (currentVersion === CURRENT_SCHEMA_VERSION) {
    return true // Already at the latest version
  }

  let success = true

  // Apply migrations sequentially
  if (currentVersion < 1) {
    success = migrateV0ToV1()
    if (!success) return false
  }

  // Add more migration steps as needed for future versions
  // if (currentVersion < 2) {
  //   success = migrateV1ToV2()
  //   if (!success) return false
  // }

  // Update the version number if all migrations succeeded
  if (success) {
    updateSchemaVersion(CURRENT_SCHEMA_VERSION)

    toast({
      title: "Data Migrated",
      description: `Successfully migrated data schema from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}.`,
    })
  } else {
    toast({
      title: "Migration Failed",
      description: "Failed to migrate data schema. Some features might not work correctly.",
      variant: "destructive",
    })
  }

  return success
}

// Export backup/restore functions
export function exportWellnessData(): string {
  try {
    const categories = safelyGetFromStorage(STORAGE_KEYS.CATEGORIES, null, [])
    const goals = safelyGetFromStorage(STORAGE_KEYS.GOALS, null, [])
    const entries = safelyGetFromStorage(STORAGE_KEYS.ENTRIES, null, [])
    const settings = safelyGetFromStorage(STORAGE_KEYS.SETTINGS, null, {})

    const exportData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        categories,
        goals,
        entries,
        settings,
      },
    }

    return JSON.stringify(exportData)
  } catch (error) {
    console.error("Error exporting wellness data:", error)
    toast({
      title: "Export Failed",
      description: "Failed to export wellness data.",
      variant: "destructive",
    })
    return ""
  }
}

export function importWellnessData(jsonData: string): boolean {
  try {
    const importedData = JSON.parse(jsonData)

    // Validate the imported data
    if (!importedData.schemaVersion || !importedData.data) {
      toast({
        title: "Invalid Import",
        description: "The imported data has an invalid format.",
        variant: "destructive",
      })
      return false
    }

    // Handle schema version differences
    if (importedData.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      toast({
        title: "Schema Version Mismatch",
        description: `Importing data from schema v${importedData.schemaVersion} to v${CURRENT_SCHEMA_VERSION}.`,
      })
      // Apply migrations if needed
    }

    // Import the data
    if (importedData.data.categories) {
      safelySetInStorage(STORAGE_KEYS.CATEGORIES, importedData.data.categories)
    }

    if (importedData.data.goals) {
      safelySetInStorage(STORAGE_KEYS.GOALS, importedData.data.goals)
    }

    if (importedData.data.entries) {
      safelySetInStorage(STORAGE_KEYS.ENTRIES, importedData.data.entries)
    }

    if (importedData.data.settings) {
      safelySetInStorage(STORAGE_KEYS.SETTINGS, importedData.data.settings)
    }

    toast({
      title: "Import Successful",
      description: "Wellness data has been imported successfully.",
    })

    return true
  } catch (error) {
    console.error("Error importing wellness data:", error)
    toast({
      title: "Import Failed",
      description: "Failed to import wellness data. The data format may be invalid.",
      variant: "destructive",
    })
    return false
  }
}
