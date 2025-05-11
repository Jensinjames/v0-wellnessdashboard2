import { PermissionFixer } from "@/components/debug/permission-fixer"

export default function DatabasePermissionsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Database Permissions Diagnostics</h1>
      <p className="mb-6 text-muted-foreground">
        This tool helps diagnose and fix database permission issues (DB-GRANT-001) that might be affecting your
        application.
      </p>

      <PermissionFixer />
    </div>
  )
}
