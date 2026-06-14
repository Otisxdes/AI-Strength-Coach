import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Set, Exercise } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function estimateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function getBestSet(sets: Set[]): Set | null {
  if (sets.length === 0) return null
  return sets.reduce((best, set) => {
    const bestRM = estimateOneRM(best.weight_kg ?? 0, best.reps)
    const setRM = estimateOneRM(set.weight_kg ?? 0, set.reps)
    return setRM > bestRM ? set : best
  })
}

export function getProgressionSuggestion(
  exercise: Exercise,
  recentSets: Set[]
): { weight: number | null; reps: number; reason: string } {
  if (recentSets.length === 0) {
    return { weight: null, reps: exercise.rep_range_min, reason: 'No previous data. Start light and focus on form.' }
  }

  const lastSessionSets = recentSets.slice(0, 3)
  const avgReps = lastSessionSets.reduce((sum, s) => sum + s.reps, 0) / lastSessionSets.length
  const topWeight = Math.max(...lastSessionSets.map(s => s.weight_kg ?? 0))
  const { rep_range_min, rep_range_max } = exercise

  if (exercise.is_bodyweight) {
    const maxReps = Math.max(...lastSessionSets.map(s => s.reps))
    if (maxReps >= rep_range_max) {
      return { weight: null, reps: maxReps, reason: `Reached ${maxReps} reps. Consider adding load or progressing to a harder variation.` }
    }
    return { weight: null, reps: maxReps + 1, reason: `Aim for ${maxReps + 1} reps. You hit ${maxReps} last time.` }
  }

  if (avgReps >= rep_range_max) {
    const increment = topWeight >= 40 ? 2.5 : 1.25
    return {
      weight: topWeight + increment,
      reps: rep_range_min,
      reason: `You averaged ${avgReps.toFixed(0)} reps at ${topWeight}kg — top of range. Increase weight to ${topWeight + increment}kg.`
    }
  }

  if (avgReps < rep_range_min) {
    return {
      weight: topWeight,
      reps: rep_range_min,
      reason: `Averaging ${avgReps.toFixed(0)} reps — below range. Keep weight at ${topWeight}kg and focus on hitting ${rep_range_min} reps.`
    }
  }

  return {
    weight: topWeight,
    reps: Math.min(Math.ceil(avgReps) + 1, rep_range_max),
    reason: `You're in range at ${avgReps.toFixed(0)} reps. Target ${Math.min(Math.ceil(avgReps) + 1, rep_range_max)} reps this session.`
  }
}

export function getTrend(sessions: Set[][]): 'improving' | 'stable' | 'declining' {
  if (sessions.length < 2) return 'stable'
  const e1RMs = sessions.map(s => {
    const best = getBestSet(s)
    if (!best) return 0
    return estimateOneRM(best.weight_kg ?? 0, best.reps)
  })
  const recent = e1RMs.slice(0, 3)
  const older = e1RMs.slice(3, 6)
  if (older.length === 0) return 'stable'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  if (recentAvg > olderAvg * 1.02) return 'improving'
  if (recentAvg < olderAvg * 0.98) return 'declining'
  return 'stable'
}

export function formatWeight(weight: number | null, isBodyweight: boolean): string {
  if (isBodyweight) return 'BW'
  if (weight === null) return '—'
  return `${weight}kg`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
