export interface Profile {
  id: string
  user_id: string
  name: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  training_experience: 'beginner' | 'intermediate' | 'advanced' | null
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general' | null
  split: string[]
  created_at: string
}

export interface Exercise {
  id: string
  user_id: string
  name: string
  muscle_group: string
  progression_type: 'linear' | 'double_progression' | 'rep_first'
  is_bodyweight: boolean
  rep_range_min: number
  rep_range_max: number
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  workout_type: string
  notes: string | null
  created_at: string
}

export interface Set {
  id: string
  user_id: string
  workout_session_id: string
  exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number
  is_bodyweight: boolean
  rir: number | null
  notes: string | null
  created_at: string
  exercise?: Exercise
}

export interface AiSuggestion {
  id: string
  user_id: string
  exercise_id: string | null
  workout_session_id: string | null
  suggestion: string
  reason: string | null
  target_weight_kg: number | null
  target_reps: number | null
  created_at: string
  exercise?: Exercise
}

export interface ParsedSet {
  exercise_name: string
  weight_kg: number | null
  reps: number
  is_bodyweight: boolean
  notes: string | null
}

export interface ProgressionSuggestion {
  exercise: Exercise
  last_sets: Set[]
  target_weight_kg: number | null
  target_reps: number
  reason: string
  trend: 'improving' | 'stable' | 'declining'
}

export interface WorkoutSummary {
  session: WorkoutSession
  exercises: {
    exercise: Exercise
    sets: Set[]
    best_set: Set
    previous_best: Set | null
    progress: 'improved' | 'stable' | 'declined'
    next_target_weight: number | null
    next_target_reps: number
  }[]
}
