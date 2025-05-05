"use client"

import { useState } from "react"
import { WellnessProvider } from "@/context/wellness-context"
import { MobileDashboard } from "@/components/mobile/mobile-dashboard"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileEntrySheet } from "@/components/mobile/mobile-entry-sheet"
import type { WellnessEntryData } from "@/types/wellness"

export default function MobileDashboardPage() {
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<WellnessEntryData | null>(null)

  // Open the form for a new entry
  const handleAddNewEntry = () => {
    setEntryToEdit(null)
    setIsAddEntryOpen(true)
  }

  // Handle editing an entry
  const handleEditEntry = (entry: WellnessEntryData) => {
    setEntryToEdit(entry)
    setIsAddEntryOpen(true)
  }

  return (
    <WellnessProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <MobileHeader onAddEntry={handleAddNewEntry} />
        <main className="flex-1 px-4 pb-20 pt-4">
          <MobileDashboard onEditEntry={handleEditEntry} />
        </main>
        <MobileNavigation />
        <MobileEntrySheet open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen} entryToEdit={entryToEdit} />
      </div>
    </WellnessProvider>
  )
}
