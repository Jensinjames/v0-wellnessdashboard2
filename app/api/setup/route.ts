import { NextResponse } from "next/server"
import { createUserProfilesTable } from "@/scripts/create-user-profiles-table"

export async function GET() {
  try {
    await createUserProfilesTable()
    return NextResponse.json({ success: true, message: "Database setup completed successfully" })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      { success: false, message: "Database setup failed", error: String(error) },
      { status: 500 },
    )
  }
}
