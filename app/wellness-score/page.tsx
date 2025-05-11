import WellnessScoreCalculator from "@/components/wellness-score/wellness-score-calculator"

export const metadata = {
  title: "Wellness Score Calculator",
  description: "Calculate your personalized wellness score based on your daily habits and metrics",
}

export default function WellnessScorePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Wellness Score Calculator</h1>
      <p className="text-center mb-8 text-muted-foreground max-w-2xl mx-auto">
        This calculator uses our Edge Function to analyze your wellness metrics and provide personalized recommendations
        to improve your overall well-being.
      </p>

      <WellnessScoreCalculator />
    </div>
  )
}
