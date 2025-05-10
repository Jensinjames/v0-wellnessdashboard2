"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

/**
 * Server action for uploading a text file
 */
export async function uploadTextFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    // Upload to Vercel Blob
    const result = await put(file.name, file, {
      access: "public",
      contentType: file.type || "text/plain",
    })

    // Revalidate the path to update UI
    revalidatePath("/files")

    return { success: true, url: result.url }
  } catch (error) {
    console.error("Error in server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
