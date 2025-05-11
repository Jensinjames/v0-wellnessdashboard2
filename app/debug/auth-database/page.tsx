import { AuthDatabaseFixer } from "@/components/debug/auth-database-fixer"

export default function AuthDatabasePage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Database Diagnostics</h1>
      <AuthDatabaseFixer />
    </div>
  )
}
