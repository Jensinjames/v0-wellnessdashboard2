import { supabase } from "@/lib/supabase"

export async function updateProfile(profileData: {
  full_name?: string
  username?: string
  bio?: string
  phone?: string
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: profileData,
  })

  if (error) {
    throw error
  }

  return data
}

export async function uploadAvatar(file: File) {
  // Generate a unique file name
  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload the file to Supabase Storage
  const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(filePath)

  // Update the user's avatar_url
  const { data, error } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  })

  if (error) {
    throw error
  }

  return data
}

export async function removeAvatar() {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.user_metadata?.avatar_url) {
    return
  }

  // Extract file path from URL
  const url = new URL(user.user_metadata.avatar_url)
  const filePath = url.pathname.split("/").slice(-2).join("/")

  // Remove the file from storage
  if (filePath) {
    const { error: removeError } = await supabase.storage.from("profiles").remove([filePath])

    if (removeError) {
      throw removeError
    }
  }

  // Update user metadata to remove avatar_url
  const { data, error } = await supabase.auth.updateUser({
    data: { avatar_url: null },
  })

  if (error) {
    throw error
  }

  return data
}
