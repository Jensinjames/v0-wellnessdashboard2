// Recommendations based on wellness scores
export function getRecommendations(scores, metrics) {
  const recommendations = []

  // Add overall recommendations
  if (scores.overall_score < 50) {
    recommendations.push({
      category: "overall",
      priority: "high",
      message:
        "Your overall wellness score indicates several areas need attention. Focus on small improvements in sleep and stress management first.",
    })
  } else if (scores.overall_score < 70) {
    recommendations.push({
      category: "overall",
      priority: "medium",
      message:
        "Your wellness score is moderate. Look at your lowest category scores to see where to focus your efforts.",
    })
  } else {
    recommendations.push({
      category: "overall",
      priority: "low",
      message: "Great job! Your overall wellness score is good. Keep maintaining your healthy habits.",
    })
  }

  // Add sleep recommendations
  if (scores.sleep_score < 60) {
    recommendations.push({
      category: "sleep",
      priority: "high",
      message: `You're getting ${metrics.sleep} hours of sleep, which is below the recommended 7-9 hours. Try to establish a consistent sleep schedule and bedtime routine.`,
    })
  } else if (scores.sleep_score < 80) {
    recommendations.push({
      category: "sleep",
      priority: "medium",
      message:
        "Your sleep could be improved. Focus on sleep quality by reducing screen time before bed and creating a comfortable sleep environment.",
    })
  }

  // Add exercise recommendations
  if (scores.exercise_score < 60) {
    recommendations.push({
      category: "exercise",
      priority: "high",
      message: `You're getting ${metrics.exercise} minutes of exercise. Try to increase to at least 30 minutes of moderate activity daily.`,
    })
  } else if (metrics.meditation === 0) {
    recommendations.push({
      category: "exercise",
      priority: "medium",
      message:
        "Consider adding a short meditation practice to your routine. Even 5 minutes daily can help reduce stress and improve focus.",
    })
  }

  // Add nutrition recommendations
  if (scores.nutrition_score < 70) {
    if (metrics.water < 6) {
      recommendations.push({
        category: "nutrition",
        priority: "high",
        message: `You're drinking ${metrics.water} glasses of water daily. Try to increase to at least 8 glasses for better hydration.`,
      })
    }
    if (metrics.nutrition < 7) {
      recommendations.push({
        category: "nutrition",
        priority: "high",
        message: "Consider improving your nutrition by adding more vegetables and whole foods to your meals.",
      })
    }
  }

  // Add stress recommendations
  if (scores.stress_score < 70) {
    recommendations.push({
      category: "stress",
      priority: "high",
      message:
        "Your stress levels appear elevated. Consider stress-reduction techniques like deep breathing, meditation, or time in nature.",
    })
  }

  // Add category-specific recommendation if user specified a focus area
  if (metrics.category) {
    const category = metrics.category.toLowerCase()

    switch (category) {
      case "sleep":
        recommendations.push({
          category: "sleep",
          priority: "medium",
          message:
            "Since you're focusing on sleep, try the 4-7-8 breathing technique before bed: inhale for 4 seconds, hold for 7, exhale for 8.",
        })
        break
      case "exercise":
        recommendations.push({
          category: "exercise",
          priority: "medium",
          message:
            "For your exercise focus, consider adding variety to your routine with both cardio and strength training for balanced fitness.",
        })
        break
      case "nutrition":
        recommendations.push({
          category: "nutrition",
          priority: "medium",
          message:
            'For nutrition improvement, try the "half plate" rule: fill half your plate with vegetables at lunch and dinner.',
        })
        break
      case "stress":
        recommendations.push({
          category: "stress",
          priority: "medium",
          message:
            "For stress management, try the 5-5-5 technique: identify 5 things you can see, 5 things you can hear, and 5 things you can feel.",
        })
        break
    }
  }

  return recommendations
}
