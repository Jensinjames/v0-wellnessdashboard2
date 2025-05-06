import { NextResponse } from "next/server"
import { setupUserProfilesTable } from "@/actions/user-actions"

export async function GET() {
  try {
    const result = await setupUserProfilesTable()

    if (!result.success) {
      throw new Error(result.message || "Database setup failed")
    }

    return NextResponse.json({ success: true, message: "Database setup completed successfully" })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      { success: false, message: "Database setup failed", error: String(error) },
      { status: 500 },
    )
  }
}
