import SafeClassNamesDemo from "@/components/safe-class-names-demo"

export default function ClassNamesUtilityPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Safe Class Names Utility</h1>
      <p className="text-lg mb-8">
        This utility helps prevent React rendering errors by ensuring class names are always properly formatted strings.
      </p>
      <SafeClassNamesDemo />
    </div>
  )
}
