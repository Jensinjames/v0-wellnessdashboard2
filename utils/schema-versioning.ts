import { toast } from "@/hooks/use-toast"
import { STORAGE_KEYS, safelyGetFromStorage, safelySetInStorage } from "@/utils/storage-utils"
import { arrayToNormalizedStore, normalizedStoreToArray } from "@/utils/normalized-store"
import { categoriesArraySchema, goalsArraySchema, entriesArraySchema } from "@/schemas/wellness-schemas"

// Schema version tracking
const SCHEMA_VERSION_KEY = "wellness_schema_version"
const CURRENT_SCHEMA_VERSION = 2 // Increment this when making schema changes

// Migration metadata to track applied migrations
interface MigrationMeta {
  version: number
  appliedAt: string
  success: boolean
  details?: string
}

const MIGRATION_META_KEY = "wellness_migrations_meta"

// Get current schema version from storage
export function getCurrentSchemaVersion(): number {
  const version = localStorage.getItem(SCHEMA_VERSION_KEY)
  return version ? Number.parseInt(version, 10) : 0
}

// Update schema version in storage
function updateSchemaVersion(version: number): void {
  localStorage.setItem(SCHEMA_VERSION_KEY, version.toString())

  // Record migration metadata
  const migrationMeta: MigrationMeta = {
    version,
    appliedAt: new Date().toISOString(),
    success: true,
  }

  const existingMeta = localStorage.getItem(MIGRATION_META_KEY)
  const metaArray: MigrationMeta[] = existingMeta ? JSON.parse(existingMeta) : []
  metaArray.push(migrationMeta)
  localStorage.setItem(MIGRATION_META_KEY, JSON.stringify(metaArray))
}

// Create a backup of all data before migration
function createBackup(version: number): string {
  try {
    const backup = {
      schemaVersion: version,
      timestamp: new Date().toISOString(),
      categories: localStorage.getItem(STORAGE_KEYS.CATEGORIES),
      goals: localStorage.getItem(STORAGE_KEYS.GOALS),
      entries: localStorage.getItem(STORAGE_KEYS.ENTRIES),
      settings: localStorage.getItem(STORAGE_KEYS.SETTINGS),
      userPreferences: localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
    }

    const backupString = JSON.stringify(backup)
    const backupKey = `wellness_backup_v${version}_${Date.now()}`
    localStorage.setItem(backupKey, backupString)

    return backupKey
  } catch (error) {
    console.error("Failed to create backup:", error)
    return ""
  }
}

// Restore from backup if migration fails
function restoreFromBackup(backupKey: string): boolean {
  try {
    const backupString = localStorage.getItem(backupKey)
    if (!backupString) return false

    const backup = JSON.parse(backupString)

    if (backup.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, backup.categories)
    if (backup.goals) localStorage.setItem(STORAGE_KEYS.GOALS, backup.goals)
    if (backup.entries) localStorage.setItem(STORAGE_KEYS.ENTRIES, backup.entries)
    if (backup.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, backup.settings)
    if (backup.userPreferences) localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, backup.userPreferences)

    // Restore schema version
    localStorage.setItem(SCHEMA_VERSION_KEY, backup.schemaVersion.toString())

    return true
  } catch (error) {
    console.error("Failed to restore from backup:", error)
    return false
  }
}

// Migration from v0 to v1: Add createdAt and updatedAt to entries
function migrateV0ToV1(): boolean {
  try {
    console.log("Running migration: v0 to v1")

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

// Migration from v1 to v2: Convert to normalized data structure
function migrateV1ToV2(): boolean {
  try {
    console.log("Running migration: v1 to v2")

    // Get data in array format
    const categoriesArray = safelyGetFromStorage(STORAGE_KEYS.CATEGORIES, categoriesArraySchema, [], false)

    const goalsArray = safelyGetFromStorage(STORAGE_KEYS.GOALS, goalsArraySchema, [], false)

    const entriesArray = safelyGetFromStorage(STORAGE_KEYS.ENTRIES, entriesArraySchema, [], false)

    // Convert to normalized format
    const normalizedCategories = arrayToNormalizedStore(normalizedStoreToArray(categoriesArray))
    const normalizedGoals = arrayToNormalizedStore(normalizedStoreToArray(goalsArray))
    const normalizedEntries = arrayToNormalizedStore(normalizedStoreToArray(entriesArray))

    // Save normalized data
    safelySetInStorage(STORAGE_KEYS.CATEGORIES, normalizedCategories)
    safelySetInStorage(STORAGE_KEYS.GOALS, normalizedGoals)
    safelySetInStorage(STORAGE_KEYS.ENTRIES, normalizedEntries)

    return true
  } catch (error) {
    console.error("Error during schema migration v1 to v2:", error)
    return false
  }
}

// Add more migration functions for future versions here
// function migrateV2ToV3(): boolean { ... }

// Map of migration functions by version
const migrationFunctions: Record<number, () => boolean> = {
  0: migrateV0ToV1,
  1: migrateV1ToV2,
  // Add more migrations as needed
  // 2: migrateV2ToV3,
}

// Execute schema migrations
export function runSchemaMigrations(): boolean {
  const currentVersion = getCurrentSchemaVersion()

  if (currentVersion === CURRENT_SCHEMA_VERSION) {
    return true // Already at the latest version
  }

  console.log(`Starting migrations from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}`)

  // Create a backup before migrations
  const backupKey = createBackup(currentVersion)

  let success = true
  let targetVersion = currentVersion

  try {
    // Apply migrations sequentially
    for (let version = currentVersion; version < CURRENT_SCHEMA_VERSION; version++) {
      targetVersion = version + 1

      if (migrationFunctions[version]) {
        success = migrationFunctions[version]()
        if (!success) break
      } else {
        console.warn(`No migration function found for version ${version} to ${version + 1}`)
      }
    }

    // Update the version number if all migrations succeeded
    if (success) {
      updateSchemaVersion(CURRENT_SCHEMA_VERSION)

      toast({
        title: "Data Migrated",
        description: `Successfully migrated data schema from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}.`,
      })
    } else {
      // Restore from backup if migration failed
      if (backupKey && restoreFromBackup(backupKey)) {
        toast({
          title: "Migration Failed",
          description: "Failed to migrate data schema. Restored from backup.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: "Failed to migrate data schema and could not restore from backup.",
          variant: "destructive",
        })
      }

      // Record failed migration
      const migrationMeta: MigrationMeta = {
        version: targetVersion,
        appliedAt: new Date().toISOString(),
        success: false,
        details: `Failed during migration to v${targetVersion}`,
      }

      const existingMeta = localStorage.getItem(MIGRATION_META_KEY)
      const metaArray: MigrationMeta[] = existingMeta ? JSON.parse(existingMeta) : []
      metaArray.push(migrationMeta)
      localStorage.setItem(MIGRATION_META_KEY, JSON.stringify(metaArray))
    }
  } catch (error) {
    console.error("Unexpected error during migrations:", error)

    // Restore from backup if an exception occurred
    if (backupKey) {
      restoreFromBackup(backupKey)
    }

    toast({
      title: "Migration Error",
      description: "An unexpected error occurred during migration.",
      variant: "destructive",
    })

    success = false
  }

  return success
}

// Get migration history
export function getMigrationHistory(): MigrationMeta[] {
  const metaString = localStorage.getItem(MIGRATION_META_KEY)
  return metaString ? JSON.parse(metaString) : []
}

// Export data with schema version
export function exportWellnessData(): string {
  try {
    // Get data in normalized format
    const categories = safelyGetFromStorage(STORAGE_KEYS.CATEGORIES, null, [])
    const goals = safelyGetFromStorage(STORAGE_KEYS.GOALS, null, [])
    const entries = safelyGetFromStorage(STORAGE_KEYS.ENTRIES, null, [])
    const settings = safelyGetFromStorage(STORAGE_KEYS.SETTINGS, null, {})
    const userPreferences = safelyGetFromStorage(STORAGE_KEYS.USER_PREFERENCES, null, {})

    const exportData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        categories,
        goals,
        entries,
        settings,
        userPreferences,
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

// Import data with schema version handling
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

    // Create a backup before import
    createBackup(getCurrentSchemaVersion())

    // Handle schema version differences
    if (importedData.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      toast({
        title: "Schema Version Mismatch",
        description: `Importing data from schema v${importedData.schemaVersion} to v${CURRENT_SCHEMA_VERSION}.`,
      })

      // Apply migrations if needed
      if (importedData.schemaVersion < CURRENT_SCHEMA_VERSION) {
        // We need to upgrade the imported data
        // This would require implementing version-specific upgrade logic
        toast({
          title: "Schema Upgrade Required",
          description: "The imported data needs to be upgraded to the current schema version.",
        })

        // For now, we'll just import as-is and let the normal migration process handle it
      } else {
        // The imported data is from a newer version
        toast({
          title: "Warning: Newer Schema",
          description: "The imported data is from a newer schema version. Some features may not work correctly.",
          variant: "destructive",
        })
      }
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

    if (importedData.data.userPreferences) {
      safelySetInStorage(STORAGE_KEYS.USER_PREFERENCES, importedData.data.userPreferences)
    }

    // Update schema version to match the imported data
    // This ensures migrations will run if needed
    updateSchemaVersion(importedData.schemaVersion)

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
