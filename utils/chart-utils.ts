export const categoryColors = {
  faith: {
    primary: "#8b5cf6",
    secondary: "#c4b5fd",
    background: "rgba(139, 92, 246, 0.1)",
  },
  life: {
    primary: "#ec4899",
    secondary: "#f9a8d4",
    background: "rgba(236, 72, 153, 0.1)",
  },
  work: {
    primary: "#f59e0b",
    secondary: "#fcd34d",
    background: "rgba(245, 158, 11, 0.1)",
  },
  health: {
    primary: "#10b981",
    secondary: "#6ee7b7",
    background: "rgba(16, 185, 129, 0.1)",
  },
}

export const formatTime = (hours: number): string => {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (hours < 1) {
    return `${minutes} minutes`
  } else if (wholeHours === 1) {
    return minutes > 0 ? `${wholeHours} hour ${minutes} minutes` : `${wholeHours} hour`
  } else {
    return minutes > 0 ? `${wholeHours} hours ${minutes} minutes` : `${wholeHours} hours`
  }
}

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

export const calculatePercentage = (actual: number, goal: number): number => {
  return Math.min(Math.round((actual / goal) * 100), 100)
}
