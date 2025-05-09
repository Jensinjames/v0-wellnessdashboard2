import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function POST(request: Request) {
  try {
    const { sourceId, targetId } = await request.json()

    if (!sourceId || !targetId) {
      return NextResponse.json({ error: "Source ID and target ID are required" }, { status: 400 })
    }

    // Create a Supabase client with admin privileges
    const supabase = createServerComponentClient<Database>({ cookies })

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify the user is authorized to perform this operation
    // The target ID should match the authenticated user's ID
    if (session.user.id !== targetId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only migrate data to your own account" },
        { status: 403 },
      )
    }

    // Call the database function to migrate the data
    const { data, error } = await supabase.rpc("migrate_user_data", {
      source_id: sourceId,
      target_id: targetId,
    })

    if (error) {
      console.error("Error migrating user data:", error)
      return NextResponse.json({ error: `Failed to migrate user data: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User data migrated successfully",
    })
  } catch (error: any) {
    console.error("Unexpected error in migrate-user-data route:", error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
