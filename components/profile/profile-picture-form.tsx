"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useProfile } from "@/context/profile-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Trash2 } from "lucide-react"

interface ProfilePictureFormProps {
  onComplete: () => void
}

export function ProfilePictureForm({ onComplete }: ProfilePictureFormProps) {
  const { profile, uploadAvatar, deleteAvatar } = useProfile()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadAvatar(file)

      if (!result.success) {
        setError(result.error || "Failed to upload avatar")
        // Revert preview if upload failed
        setPreviewUrl(profile?.avatar_url || null)
        return
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      // Revert preview if upload failed
      setPreviewUrl(profile?.avatar_url || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteAvatar()

      if (!result.success) {
        setError(result.error || "Failed to delete avatar")
        return
      }

      setPreviewUrl(null)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Picture</h3>
        <p className="text-sm text-muted-foreground">Upload a profile picture to personalize your account.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center space-y-4">
        <Avatar className="h-32 w-32">
          <AvatarImage src={previewUrl || undefined} alt={profile?.full_name || "User"} />
          <AvatarFallback>
            {profile?.full_name?.[0] || profile?.username?.[0] || profile?.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={handleSelectFile} disabled={isUploading || isDeleting}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Picture
              </>
            )}
          </Button>

          {previewUrl && (
            <Button type="button" variant="outline" onClick={handleDeleteAvatar} disabled={isUploading || isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>

      <div className="pt-4">
        <Button onClick={onComplete}>Continue</Button>
      </div>
    </div>
  )
}
