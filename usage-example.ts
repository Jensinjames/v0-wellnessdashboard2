import { uploadTextFile } from "./upload-service"

export async function handleFileUpload() {
  try {
    const content = "This is a sample text file content"
    const filename = "sample.txt"

    const url = await uploadTextFile(content, filename)

    // Now you can use the URL
    console.log(`File available at: ${url}`)
    return { success: true, url }
  } catch (error) {
    console.error("Upload handling error:", error)
    return { success: false, error: String(error) }
  }
}
