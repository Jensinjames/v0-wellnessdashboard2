import { RealtimeWellnessProvider } from "@/context/realtime-wellness-context"
import { RealtimeWellnessEntryForm } from "@/components/realtime-wellness-entry-form"

export default function RealtimeEntryPage() {
  return (
    <RealtimeWellnessProvider>
      <div className="container max-w-3xl py-10">
        <RealtimeWellnessEntryForm />
      </div>
    </RealtimeWellnessProvider>
  )
}
