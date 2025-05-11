// Utility functions for wellness score calculations

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Normalizes a value to a 0-100 scale based on min and max range
 */
export function normalize(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100)
}

/**
 * Calculates a weighted average of values
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length) {
    throw new Error("Values and weights arrays must be the same length")
  }

  const sum = weights.reduce((acc, weight) => acc + weight, 0)

  if (sum === 0) {
    throw new Error("Sum of weights cannot be zero")
  }

  return values.reduce((acc, value, i) => acc + value * weights[i], 0) / sum
}
