"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/hooks/use-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { uploadAvatar } from "@/lib/profile-service"
import { Camera, Loader2 } from "lucide-react"

export function ProfileAvatarUpload() {
  const { user, refreshUser } = useUser()
  const [isUploading, setIsUploading] = useState(false)

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U"

    const name = user.user_metadata?.full_name || user.email
    return name.charAt(0).toUpperCase()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      await uploadAvatar(file)
      await refreshUser()
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the input
      e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <Avatar className="h-24 w-24">
        <AvatarImage
          src={user?.user_metadata?.avatar_url || ""}
          alt={user?.user_metadata?.full_name || user?.email || "User"}
        />
        <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Profile Picture</h3>
        <p className="text-sm text-muted-foreground">Upload a new profile picture. JPG, PNG or GIF, max 5MB.</p>

        <div className="mt-2">
          <div className="flex items-center gap-4">
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Upload</span>
                  </>
                )}
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </Label>

            {user?.user_metadata?.avatar_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Implement remove avatar functionality
                }}
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
