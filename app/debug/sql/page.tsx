import { SQLExecutor } from "@/components/debug/sql-executor"

export default function SQLDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">SQL Executor</h1>
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 font-medium">Warning</p>
        <p className="text-yellow-700 text-sm mt-1">
          This tool allows direct execution of SQL statements against the database. Use with caution as it can
          potentially damage your database if misused.
        </p>
      </div>
      <SQLExecutor />
    </div>
  )
}
