// Define score weights
const WEIGHTS = {
  sleep: 0.25,
  exercise: 0.2,
  nutrition: 0.2,
  stress: 0.2,
  mood: 0.15,
}

// Define ideal ranges
const IDEAL_RANGES = {
  sleep: { min: 7, max: 9 }, // 7-9 hours of sleep
  exercise: { min: 30, max: 60 }, // 30-60 minutes of exercise
  meditation: { min: 10, max: 30 }, // 10-30 minutes of meditation
  water: { min: 6, max: 10 }, // 6-10 glasses of water
  nutrition: { min: 7, max: 10 }, // 7-10 nutrition quality
  stress: { min: 1, max: 4 }, // 1-4 stress level (lower is better)
  mood: { min: 7, max: 10 }, // 7-10 mood rating
}

export function calculateWellnessScore(metrics) {
  // Calculate individual scores
  const sleepScore = calculateSleepScore(metrics.sleep)
  const exerciseScore = calculateExerciseScore(metrics.exercise, metrics.meditation || 0)
  const nutritionScore = calculateNutritionScore(metrics.nutrition, metrics.water)
  const stressScore = calculateStressScore(metrics.stress, metrics.mood)

  // Calculate overall score (weighted average)
  const overallScore =
    sleepScore * WEIGHTS.sleep +
    exerciseScore * WEIGHTS.exercise +
    nutritionScore * WEIGHTS.nutrition +
    stressScore * WEIGHTS.stress +
    (metrics.mood / 10) * 100 * WEIGHTS.mood

  return {
    overall_score: Math.round(overallScore),
    sleep_score: Math.round(sleepScore),
    exercise_score: Math.round(exerciseScore),
    nutrition_score: Math.round(nutritionScore),
    stress_score: Math.round(stressScore),
  }
}

function calculateSleepScore(hours) {
  const ideal = IDEAL_RANGES.sleep

  // Sleep follows a bell curve - too little or too much reduces score
  if (hours < ideal.min) {
    // Below ideal range
    return (hours / ideal.min) * 100
  } else if (hours > ideal.max) {
    // Above ideal range (diminishing returns)
    return Math.max(70, 100 - ((hours - ideal.max) / 2) * 30)
  } else {
    // Within ideal range
    return 100
  }
}

function calculateExerciseScore(exerciseMinutes, meditationMinutes) {
  const exerciseIdeal = IDEAL_RANGES.exercise
  const meditationIdeal = IDEAL_RANGES.meditation

  // Calculate exercise component (80% of score)
  let exerciseComponent
  if (exerciseMinutes < exerciseIdeal.min) {
    exerciseComponent = (exerciseMinutes / exerciseIdeal.min) * 100
  } else if (exerciseMinutes > exerciseIdeal.max * 2) {
    // Potential overtraining - score starts to decrease after 2x ideal max
    exerciseComponent = Math.max(70, 100 - ((exerciseMinutes - exerciseIdeal.max * 2) / 30) * 10)
  } else if (exerciseMinutes > exerciseIdeal.max) {
    // Above ideal but not overtraining
    exerciseComponent = 100
  } else {
    // Within ideal range
    exerciseComponent = 100
  }

  // Calculate meditation component (20% of score)
  let meditationComponent = 0
  if (meditationMinutes > 0) {
    if (meditationMinutes < meditationIdeal.min) {
      meditationComponent = (meditationMinutes / meditationIdeal.min) * 100
    } else {
      meditationComponent = 100
    }
  }

  // Combine scores (80% exercise, 20% meditation)
  return exerciseComponent * 0.8 + meditationComponent * 0.2
}

function calculateNutritionScore(nutritionRating, waterGlasses) {
  const nutritionIdeal = IDEAL_RANGES.nutrition
  const waterIdeal = IDEAL_RANGES.water

  // Calculate nutrition component (70% of score)
  const nutritionComponent = (nutritionRating / 10) * 100

  // Calculate water component (30% of score)
  let waterComponent
  if (waterGlasses < waterIdeal.min) {
    waterComponent = (waterGlasses / waterIdeal.min) * 100
  } else {
    waterComponent = 100
  }

  // Combine scores
  return nutritionComponent * 0.7 + waterComponent * 0.3
}

function calculateStressScore(stressLevel, moodRating) {
  const stressIdeal = IDEAL_RANGES.stress

  // Invert stress level (lower stress is better)
  const invertedStress = 11 - stressLevel

  // Calculate stress component (70% of score)
  const stressComponent = (invertedStress / 10) * 100

  // Calculate mood component (30% of score)
  const moodComponent = (moodRating / 10) * 100

  // Combine scores
  return stressComponent * 0.7 + moodComponent * 0.3
}
