import { v4 as uuidv4 } from "uuid"

// Use the singleton pattern for consistent client usage
import { getSupabaseClient } from "./supabase-singleton"

/**
 * Available storage buckets in the application
 */
export enum StorageBucket {
  AVATARS = "avatars",
  JOURNAL_ATTACHMENTS = "journal-attachments",
  WELLNESS_EXPORTS = "wellness-exports",
}

/**
 * Generate a path for storing user files with proper structure
 *
 * @param userId The user's ID
 * @param filename Optional filename (will generate UUID if not provided)
 * @param subfolder Optional subfolder within user directory
 * @returns A properly formatted storage path
 */
export function generateStoragePath(userId: string, filename?: string, subfolder?: string): string {
  const actualFilename = filename || `${uuidv4()}`

  if (subfolder) {
    return `${userId}/${subfolder}/${actualFilename}`
  }

  return `${userId}/${actualFilename}`
}

/**
 * Upload a file to Supabase Storage
 *
 * @param bucket The storage bucket to use
 * @param path The storage path including filename
 * @param file The file to upload
 * @param contentType Optional content type
 * @returns Upload result with URL
 */
export async function uploadFile(bucket: StorageBucket, path: string, file: File | Blob, contentType?: string) {
  const supabase = getSupabaseClient()

  const options = contentType ? { contentType } : undefined

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    ...options,
  })

  if (error) {
    console.error("Error uploading file:", error)
    throw error
  }

  // Generate a public URL for the file
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    ...data,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Upload an avatar image for a user
 *
 * @param userId User ID
 * @param file Image file
 * @returns Upload result with public URL
 */
export async function uploadAvatar(userId: string, file: File) {
  // Determine file extension from file type
  const fileExt = file.name.split(".").pop()
  const path = generateStoragePath(userId, `avatar.${fileExt}`)

  return uploadFile(StorageBucket.AVATARS, path, file, file.type)
}

/**
 * Upload a journal attachment
 *
 * @param userId User ID
 * @param journalEntryId Journal entry ID
 * @param file File to attach
 * @returns Upload result with URL
 */
export async function uploadJournalAttachment(userId: string, journalEntryId: string, file: File) {
  const path = generateStoragePath(userId, file.name, journalEntryId)

  return uploadFile(StorageBucket.JOURNAL_ATTACHMENTS, path, file, file.type)
}

/**
 * Create and store a wellness data export
 *
 * @param userId User ID
 * @param exportData Export data as blob
 * @param exportType Type of export (e.g., 'weekly', 'monthly')
 * @param format File format (e.g., 'json', 'csv')
 * @returns Upload result with URL
 */
export async function createWellnessExport(userId: string, exportData: Blob, exportType: string, format = "json") {
  const dateStr = new Date().toISOString().split("T")[0]
  const path = generateStoragePath(userId, `${exportType}-export.${format}`, dateStr)

  const contentType = format === "json" ? "application/json" : "text/csv"

  return uploadFile(StorageBucket.WELLNESS_EXPORTS, path, exportData, contentType)
}

/**
 * Delete a file from storage
 *
 * @param bucket Storage bucket
 * @param path Path to file
 * @returns Success status
 */
export async function deleteFile(bucket: StorageBucket, path: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error("Error deleting file:", error)
    throw error
  }

  return { success: true }
}

/**
 * List files in a directory
 *
 * @param bucket Storage bucket
 * @param path Directory path
 * @returns Array of files
 */
export async function listFiles(bucket: StorageBucket, path = "") {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.storage.from(bucket).list(path)

  if (error) {
    console.error("Error listing files:", error)
    throw error
  }

  return data
}
