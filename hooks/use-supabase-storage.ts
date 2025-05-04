"use client"

import { useState } from "react"
import { useSupabase } from "./use-supabase"

interface UploadState {
  isUploading: boolean
  progress: number
  error: Error | null
  url: string | null
}

interface DownloadState {
  isDownloading: boolean
  error: Error | null
  data: Blob | null
}

/**
 * Hook for uploading files to Supabase Storage
 */
export function useSupabaseUpload(bucket: string) {
  const supabase = useSupabase()
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    url: null,
  })

  const upload = async (file: File, path: string, options: { upsert?: boolean; contentType?: string } = {}) => {
    try {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
        url: null,
      })

      // Upload the file
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: options.upsert ?? false,
        contentType: options.contentType,
        // Add progress handler if needed in the future
      })

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        url: urlData.publicUrl,
      })

      return { path: data.path, url: urlData.publicUrl, error: null }
    } catch (error) {
      console.error("Error uploading file:", error)
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))

      return {
        path: null,
        url: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  const remove = async (path: string) => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path])

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Error removing file:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  return {
    upload,
    remove,
    ...state,
  }
}

/**
 * Hook for downloading files from Supabase Storage
 */
export function useSupabaseDownload(bucket: string) {
  const supabase = useSupabase()
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    error: null,
    data: null,
  })

  const download = async (path: string) => {
    try {
      setState({
        isDownloading: true,
        error: null,
        data: null,
      })

      const { data, error } = await supabase.storage.from(bucket).download(path)

      if (error) {
        throw error
      }

      setState({
        isDownloading: false,
        error: null,
        data,
      })

      return { data, error: null }
    } catch (error) {
      console.error("Error downloading file:", error)
      setState({
        isDownloading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      })

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  return {
    download,
    ...state,
  }
}
