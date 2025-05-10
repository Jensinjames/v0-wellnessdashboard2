import { put } from "@vercel/blob"

/**
 * Uploads a text file to Vercel Blob storage
 * @param content The text content to upload
 * @param filename The name of the file
 * @returns The URL of the uploaded blob
 */
export async function uploadTextFile(content: string, filename: string): Promise<string> {
  try {
    // Convert text to Blob with proper MIME type
    const blob = new Blob([content], { type: "text/plain" })

    // Upload to Vercel Blob with proper configuration
    const result = await put(filename, blob, {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false, // Set to true if you want unique filenames
    })

    console.log(`File uploaded successfully to ${result.url}`)
    return result.url
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
  }
}
