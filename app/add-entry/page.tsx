import { SupabaseWellnessProvider } from "@/context/supabase-wellness-context"
import { SupabaseWellnessEntryForm } from "@/components/supabase-wellness-entry-form"

export default function AddEntryPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add Wellness Entry</h1>
      <SupabaseWellnessProvider>
        <SupabaseWellnessEntryForm />
      </SupabaseWellnessProvider>
    </div>
  )
}
