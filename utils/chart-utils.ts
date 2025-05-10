import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks } from "date-fns"
import type { WellnessEntry } from "@/types/entry"

// Get entries for a specific date
export function getEntriesForDate(entries: WellnessEntry[], date: Date): WellnessEntry[] {
  return entries.filter((entry) => isSameDay(new Date(entry.date), date))
}

// Get average score for a specific category on a specific date
export function getCategoryScoreForDate(
  entries: WellnessEntry[],
  date: Date,
  category: "faith" | "life" | "work" | "health",
): number {
  const dateEntries = getEntriesForDate(entries, date)
  if (dateEntries.length === 0) return 0

  const scores = dateEntries.map((entry) => getCategoryScore(entry, category))
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

// Get overall score for a specific date
export function getOverallScoreForDate(entries: WellnessEntry[], date: Date): number {
  const dateEntries = getEntriesForDate(entries, date)
  if (dateEntries.length === 0) return 0

  const scores = dateEntries.map((entry) => getOverallScore(entry))
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

// Get category score for an entry
export function getCategoryScore(entry: WellnessEntry, category: "faith" | "life" | "work" | "health"): number {
  switch (category) {
    case "faith":
      return Math.min(100, (entry.dailyPrayer / 30 + entry.meditation / 20 + entry.scriptureStudy / 30) * 33.3)
    case "life":
      return Math.min(100, (entry.familyTime / 3 + entry.socialActivities / 6 + entry.hobbies / 5) * 33.3)
    case "work":
      return Math.min(100, (entry.productivity + entry.projectsCompleted * 10 + entry.learningHours * 5) / 3)
    case "health":
      return Math.min(
        100,
        ((entry.exercise / 5) * 100 + (entry.sleep / 8) * 100 + ((10 - entry.stressLevel) / 10) * 100) / 3,
      )
    default:
      return 0
  }
}

// Get overall score for an entry
export function getOverallScore(entry: WellnessEntry): number {
  const faithScore = getCategoryScore(entry, "faith")
  const lifeScore = getCategoryScore(entry, "life")
  const workScore = getCategoryScore(entry, "work")
  const healthScore = getCategoryScore(entry, "health")

  return Math.round((faithScore + lifeScore + workScore + healthScore) / 4)
}

// Get data for weekly trend chart
export function getWeeklyTrendData(entries: WellnessEntry[], numWeeks = 4): any[] {
  const today = new Date()
  const result = []

  // Generate data for each of the past numWeeks weeks
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = startOfWeek(subWeeks(today, i))
    const weekEnd = endOfWeek(subWeeks(today, i))
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const weekData = {
      name: `Week ${numWeeks - i}`,
      faith: 0,
      life: 0,
      work: 0,
      health: 0,
      overall: 0,
      // Store actual date for tooltip
      startDate: format(weekStart, "MMM d"),
      endDate: format(weekEnd, "MMM d"),
    }

    // Calculate average scores for the week
    let faithSum = 0,
      lifeSum = 0,
      workSum = 0,
      healthSum = 0,
      overallSum = 0
    let daysWithEntries = 0

    daysInWeek.forEach((day) => {
      const dayEntries = getEntriesForDate(entries, day)
      if (dayEntries.length > 0) {
        daysWithEntries++
        faithSum += getCategoryScoreForDate(entries, day, "faith")
        lifeSum += getCategoryScoreForDate(entries, day, "life")
        workSum += getCategoryScoreForDate(entries, day, "work")
        healthSum += getCategoryScoreForDate(entries, day, "health")
        overallSum += getOverallScoreForDate(entries, day)
      }
    })

    if (daysWithEntries > 0) {
      weekData.faith = Math.round(faithSum / daysWithEntries)
      weekData.life = Math.round(lifeSum / daysWithEntries)
      weekData.work = Math.round(workSum / daysWithEntries)
      weekData.health = Math.round(healthSum / daysWithEntries)
      weekData.overall = Math.round(overallSum / daysWithEntries)
    }

    result.unshift(weekData) // Add to beginning so weeks are in chronological order
  }

  return result
}

// Get data for daily trend chart (last 14 days)
export function getDailyTrendData(entries: WellnessEntry[], days = 14): any[] {
  const today = new Date()
  const result = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    const dayEntries = getEntriesForDate(entries, date)
    const dayData = {
      name: format(date, "MMM d"),
      date: date,
      faith: getCategoryScoreForDate(entries, date, "faith"),
      life: getCategoryScoreForDate(entries, date, "life"),
      work: getCategoryScoreForDate(entries, date, "work"),
      health: getCategoryScoreForDate(entries, date, "health"),
      overall: getOverallScoreForDate(entries, date),
    }

    result.push(dayData)
  }

  return result
}

// Get data for category comparison chart
export function getCategoryComparisonData(entries: WellnessEntry[]): any[] {
  if (entries.length === 0) return []

  // Calculate average scores for each category
  let faithSum = 0,
    lifeSum = 0,
    workSum = 0,
    healthSum = 0

  entries.forEach((entry) => {
    faithSum += getCategoryScore(entry, "faith")
    lifeSum += getCategoryScore(entry, "life")
    workSum += getCategoryScore(entry, "work")
    healthSum += getCategoryScore(entry, "health")
  })

  const faithAvg = Math.round(faithSum / entries.length)
  const lifeAvg = Math.round(lifeSum / entries.length)
  const workAvg = Math.round(workSum / entries.length)
  const healthAvg = Math.round(healthSum / entries.length)

  return [
    { name: "Faith", value: faithAvg, fill: "#22c55e" },
    { name: "Life", value: lifeAvg, fill: "#eab308" },
    { name: "Work", value: workAvg, fill: "#ef4444" },
    { name: "Health", value: healthAvg, fill: "#ec4899" },
  ]
}

// Get data for radar chart
export function getRadarChartData(entries: WellnessEntry[]): any[] {
  if (entries.length === 0) return []

  // Get the most recent entry
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latestEntry = sortedEntries[0]

  // Calculate scores for each category
  const faithScore = getCategoryScore(latestEntry, "faith")
  const lifeScore = getCategoryScore(latestEntry, "life")
  const workScore = getCategoryScore(latestEntry, "work")
  const healthScore = getCategoryScore(latestEntry, "health")

  return [
    {
      subject: "Faith",
      A: faithScore,
      fullMark: 100,
    },
    {
      subject: "Life",
      A: lifeScore,
      fullMark: 100,
    },
    {
      subject: "Work",
      A: workScore,
      fullMark: 100,
    },
    {
      subject: "Health",
      A: healthScore,
      fullMark: 100,
    },
  ]
}
