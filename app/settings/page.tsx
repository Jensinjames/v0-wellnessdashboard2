import { redirect } from "next/navigation"

export default function SettingsPage() {
  // Redirect to the account settings page by default
  redirect("/settings/account")
}
