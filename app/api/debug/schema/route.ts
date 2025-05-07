import { NextResponse } from "next/server"
import { isProduction } from "@/lib/env-utils"

export async function GET() {
  // Don't expose schema information in production
  if (isProduction()) {
    return NextResponse.json({ error: "Schema information is not available in production" }, { status: 403 })
  }

  // Mock schema information for demonstration
  const schemaInfo = {
    tables: [
      {
        name: "profiles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true },
          { name: "email", type: "varchar", isUnique: true },
          { name: "first_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
          { name: "full_name", type: "varchar" },
          { name: "avatar_url", type: "varchar" },
          { name: "created_at", type: "timestamp" },
          { name: "updated_at", type: "timestamp" },
        ],
      },
      {
        name: "categories",
        columns: [
          { name: "id", type: "uuid", isPrimary: true },
          { name: "name", type: "varchar" },
          { name: "description", type: "text" },
          { name: "user_id", type: "uuid", isForeignKey: true },
          { name: "created_at", type: "timestamp" },
          { name: "updated_at", type: "timestamp" },
        ],
      },
      // Add more tables as needed
    ],
  }

  return NextResponse.json(schemaInfo)
}
