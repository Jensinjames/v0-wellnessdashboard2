"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { generateVerificationCode, getVerificationExpiry, isVerificationExpired } from "@/utils/verification-utils"
import type { VerificationRequest, VerificationSubmission } from "@/types/auth"

/**
 * Request a verification code
 */
export async function requestVerificationCode(request: VerificationRequest): Promise<{
  success: boolean
  message: string
  expiresAt?: string
}> {
  const { userId, type, value } = request

  if (!userId || !type || !value) {
    return {
      success: false,
      message: "Missing required fields",
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Generate verification code and expiry
    const verificationCode = generateVerificationCode()
    const expiresAt = getVerificationExpiry()

    // Update profile with verification token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_token: verificationCode,
        verification_token_expires_at: expiresAt,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile with verification token:", updateError)
      return {
        success: false,
        message: "Failed to generate verification code",
      }
    }

    // Send verification code
    if (type === "email") {
      await sendEmailVerification(value, verificationCode)
    } else if (type === "phone") {
      await sendSmsVerification(value, verificationCode)
    }

    return {
      success: true,
      message: `Verification code sent to your ${type}`,
      expiresAt,
    }
  } catch (error) {
    console.error(`Error requesting ${type} verification:`, error)
    return {
      success: false,
      message: `Failed to send verification code to your ${type}`,
    }
  }
}

/**
 * Verify a code
 */
export async function verifyCode(submission: VerificationSubmission): Promise<{
  success: boolean
  message: string
}> {
  const { userId, type, code } = submission

  if (!userId || !type || !code) {
    return {
      success: false,
      message: "Missing required fields",
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Get the current verification token
    const { data, error } = await supabase
      .from("profiles")
      .select("verification_token, verification_token_expires_at")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching verification token:", error)
      return {
        success: false,
        message: "Failed to verify code",
      }
    }

    // Check if token is expired
    if (isVerificationExpired(data.verification_token_expires_at)) {
      return {
        success: false,
        message: "Verification code has expired",
      }
    }

    // Check if code matches
    if (data.verification_token !== code) {
      return {
        success: false,
        message: "Invalid verification code",
      }
    }

    // Update verification status
    const updateData = type === "email" ? { email_verified: true } : { phone_verified: true }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ...updateData,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating verification status:", updateError)
      return {
        success: false,
        message: "Failed to update verification status",
      }
    }

    return {
      success: true,
      message: `Your ${type} has been verified successfully`,
    }
  } catch (error) {
    console.error(`Error verifying ${type}:`, error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Update phone number
 */
export async function updatePhoneNumber(
  userId: string,
  phone: string,
): Promise<{
  success: boolean
  message: string
}> {
  if (!userId || !phone) {
    return {
      success: false,
      message: "Missing required fields",
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        phone_verified: false,
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating phone number:", error)
      return {
        success: false,
        message: "Failed to update phone number",
      }
    }

    return {
      success: true,
      message: "Phone number updated successfully",
    }
  } catch (error) {
    console.error("Error updating phone number:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// Helper functions for sending verification codes
// In a production environment, these would use actual email/SMS services

async function sendEmailVerification(email: string, code: string): Promise<void> {
  // In a real application, you would use an email service like SendGrid, Mailgun, etc.
  console.log(`Sending verification code ${code} to email ${email}`)

  // For demo purposes, we'll just log the code
  // In production, replace with actual email sending logic

  // Example with a hypothetical email service:
  // await emailService.send({
  //   to: email,
  //   subject: "Your Verification Code",
  //   text: `Your verification code is: ${code}. It will expire in 15 minutes.`,
  //   html: `<p>Your verification code is: <strong>${code}</strong>. It will expire in 15 minutes.</p>`
  // })
}

async function sendSmsVerification(phone: string, code: string): Promise<void> {
  // In a real application, you would use an SMS service like Twilio, Nexmo, etc.
  console.log(`Sending verification code ${code} to phone ${phone}`)

  // For demo purposes, we'll just log the code
  // In production, replace with actual SMS sending logic

  // Example with a hypothetical SMS service:
  // await smsService.send({
  //   to: phone,
  //   message: `Your verification code is: ${code}. It will expire in 15 minutes.`
  // })
}
