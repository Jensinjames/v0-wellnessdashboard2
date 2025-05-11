import { redirect } from "next/navigation"

export default function AdminPerformanceRedirect() {
  redirect("/dashboard/settings/performance")
}
