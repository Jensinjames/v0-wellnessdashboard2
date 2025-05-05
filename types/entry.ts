export interface WellnessEntry {
  id: string
  date: Date
  // Faith metrics
  dailyPrayer: number
  meditation: number
  scriptureStudy: number
  // Life metrics
  familyTime: number
  socialActivities: number
  hobbies: number
  // Work metrics
  productivity: number
  projectsCompleted: number
  learningHours: number
  // Health metrics
  exercise: number
  sleep: number
  stressLevel: number
}
