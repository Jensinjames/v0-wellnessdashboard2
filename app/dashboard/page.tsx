import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Navigation } from "@/components/navigation"

export default function DashboardPage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <DashboardContent />
      </div>
    </>
  )
}
