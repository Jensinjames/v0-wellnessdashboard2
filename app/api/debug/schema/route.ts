import { NextResponse } from "next/server"
import { getDatabaseSchema } from "@/utils/schema-utils"

export async function GET() {
  try {
    const schema = await getDatabaseSchema()

    return NextResponse.json({
      success: true,
      schema,
    })
  } catch (error) {
    console.error("Error in schema debug endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch database schema" }, { status: 500 })
  }
}
