import { redirect } from "next/navigation"

export default function DebugDatabaseHealthRedirect() {
  redirect("/dashboard/settings/database-health")
}
