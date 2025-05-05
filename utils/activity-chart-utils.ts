// Mock implementation of activity chart utility functions

export const getActivityTimeData = (
  timeFrame: "week" | "month" | "year",
  selectedCategory: string,
  viewMode: "frequency" | "duration" | "value",
) => {
  // This would normally fetch real data
  return [
    { date: "Mon", value: 10 },
    { date: "Tue", value: 15 },
    { date: "Wed", value: 8 },
    { date: "Thu", value: 12 },
    { date: "Fri", value: 18 },
    { date: "Sat", value: 22 },
    { date: "Sun", value: 16 },
  ]
}

export const getCategoryDistribution = (timeFrame: "week" | "month" | "year", selectedCategory: string) => {
  return [
    { name: "Faith", value: 30 },
    { name: "Health", value: 25 },
    { name: "Work", value: 20 },
    { name: "Life", value: 25 },
  ]
}

export const getTimeOfDayDistribution = (timeFrame: "week" | "month" | "year", selectedCategory: string) => {
  return [
    { time: "Morning", value: 40 },
    { time: "Afternoon", value: 30 },
    { time: "Evening", value: 20 },
    { time: "Night", value: 10 },
  ]
}

export const getStreakData = (selectedCategory: string) => {
  return {
    currentStreak: 5,
    longestStreak: 12,
    totalActivities: 45,
  }
}

export const getHeatmapData = (timeFrame: "week" | "month" | "year", selectedCategory: string) => {
  // Generate a 7x4 grid for a month view (4 weeks)
  const data = []
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      data.push({
        date: new Date(2023, 0, day + 1 + week * 7),
        count: Math.floor(Math.random() * 5),
      })
    }
  }
  return data
}

export const getActivityCorrelationData = (selectedCategory: string) => {
  return [
    { category1: "Faith", category2: "Health", correlation: 0.7 },
    { category1: "Faith", category2: "Work", correlation: 0.3 },
    { category1: "Faith", category2: "Life", correlation: 0.8 },
    { category1: "Health", category2: "Work", correlation: 0.5 },
    { category1: "Health", category2: "Life", correlation: 0.6 },
    { category1: "Work", category2: "Life", correlation: 0.4 },
  ]
}
