"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { calculateWellnessScoreWithFallback, type WellnessMetrics } from "@/lib/edge-functions/wellness-score"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function WellnessScoreCalculator() {
  const [metrics, setMetrics] = useState<WellnessMetrics>({
    sleep: 7,
    exercise: 30,
    meditation: 0,
    water: 6,
    nutrition: 7,
    stress: 4,
    mood: 7,
  })

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (name: keyof WellnessMetrics, value: number) => {
    setMetrics((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await calculateWellnessScoreWithFallback(metrics)
      setResult(result)
    } catch (err: any) {
      setError(err.message || "Failed to calculate wellness score")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Wellness Score Calculator</CardTitle>
          <CardDescription>Enter your wellness metrics to calculate your personalized wellness score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sleep">Sleep (hours): {metrics.sleep}</Label>
              <Slider
                id="sleep"
                min={4}
                max={12}
                step={0.5}
                value={[metrics.sleep]}
                onValueChange={(value) => handleChange("sleep", value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="exercise">Exercise (minutes): {metrics.exercise}</Label>
              <Slider
                id="exercise"
                min={0}
                max={120}
                step={5}
                value={[metrics.exercise]}
                onValueChange={(value) => handleChange("exercise", value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="meditation">Meditation (minutes): {metrics.meditation}</Label>
              <Slider
                id="meditation"
                min={0}
                max={60}
                step={5}
                value={[metrics.meditation || 0]}
                onValueChange={(value) => handleChange("meditation", value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="water">Water (glasses): {metrics.water}</Label>
              <Slider
                id="water"
                min={0}
                max={12}
                step={1}
                value={[metrics.water]}
                onValueChange={(value) => handleChange("water", value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="nutrition">Nutrition Quality (1-10): {metrics.nutrition}</Label>
              <Slider
                id="nutrition"
                min={1}
                max={10}
                step={1}
                value={[metrics.nutrition]}
                onValueChange={(value) => handleChange("nutrition", value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="stress">Stress Level (1-10): {metrics.stress}</Label>
              <Slider
                id="stress"
                min={1}
                max={10}
                step={1}
                value={[metrics.stress]}
                onValueChange={(value) => handleChange("stress", value[0])}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">1 = Low stress, 10 = High stress</p>
            </div>

            <div>
              <Label htmlFor="mood">Mood (1-10): {metrics.mood}</Label>
              <Slider
                id="mood"
                min={1}
                max={10}
                step={1}
                value={[metrics.mood]}
                onValueChange={(value) => handleChange("mood", value[0])}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">1 = Poor mood, 10 = Excellent mood</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Calculating..." : "Calculate Wellness Score"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Wellness Score</CardTitle>
            <CardDescription>Based on your metrics from {new Date(result.timestamp).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold">{result.score.overall_score}</div>
                <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-semibold">{result.score.sleep_score}</div>
                <div className="text-xs text-muted-foreground">Sleep</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-semibold">{result.score.exercise_score}</div>
                <div className="text-xs text-muted-foreground">Exercise</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-semibold">{result.score.nutrition_score}</div>
                <div className="text-xs text-muted-foreground">Nutrition</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-semibold">{result.score.stress_score}</div>
                <div className="text-xs text-muted-foreground">Stress</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recommendations</h3>
              {result.recommendations.map((rec: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Badge
                      variant={
                        rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "outline"
                      }
                    >
                      {rec.category}
                    </Badge>
                    <Badge variant="outline">{rec.priority} priority</Badge>
                  </div>
                  <p className="text-sm">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
