import { createClient } from '@/lib/supabase/server'
import { getProgressionSuggestion, getBestSet, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Exercise, Set } from '@/lib/types'

const WORKOUT_TYPES = ['Chest + Biceps', 'Back + Triceps', 'Legs', 'Shoulders']

const MUSCLE_MAP: Record<string, string[]> = {
  'Chest + Biceps': ['Chest', 'Biceps'],
  'Back + Triceps': ['Back', 'Triceps'],
  'Legs': ['Legs'],
  'Shoulders': ['Shoulders'],
}

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  if (!type) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-xl font-bold">Workout Preview</h1>
          <p className="text-zinc-400 text-sm">Choose today's workout</p>
        </div>
        <div className="space-y-3">
          {WORKOUT_TYPES.map(t => (
            <Link
              key={t}
              href={`/preview?type=${encodeURIComponent(t)}`}
              className="block bg-zinc-900 rounded-2xl p-4 font-semibold active:bg-zinc-800 transition-colors"
            >
              {t} →
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const muscles = MUSCLE_MAP[type] || []

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .in('muscle_group', muscles)
    .order('name')

  if (!exercises?.length) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2">
          <Link href="/preview" className="text-zinc-400 text-sm">← Back</Link>
          <h1 className="text-xl font-bold mt-1">{type}</h1>
        </div>
        <p className="text-zinc-400">No exercises found for this workout type.</p>
        <Link href="/exercises" className="text-white underline text-sm">Manage exercises</Link>
      </div>
    )
  }

  // For each exercise, get last 3 sessions of data
  const exercisePreviews = await Promise.all(exercises.map(async (ex: Exercise) => {
    const { data: recentSets } = await supabase
      .from('sets')
      .select('*, workout_session:workout_sessions(date)')
      .eq('user_id', user.id)
      .eq('exercise_id', ex.id)
      .order('created_at', { ascending: false })
      .limit(9)

    const suggestion = getProgressionSuggestion(ex, (recentSets || []) as Set[])
    const lastSet = recentSets?.[0]

    return { exercise: ex, suggestion, lastSet, recentSets: recentSets || [] }
  }))

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <Link href="/preview" className="text-zinc-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold mt-1">{type}</h1>
        <p className="text-zinc-400 text-sm">Today's targets</p>
      </div>

      <Link
        href={`/log?type=${encodeURIComponent(type)}`}
        className="block bg-white text-black rounded-xl p-3 text-center font-semibold text-sm"
      >
        ➕ Start Logging
      </Link>

      <div className="space-y-3">
        {exercisePreviews.map(({ exercise, suggestion, lastSet }) => (
          <div key={exercise.id} className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/exercises/${exercise.id}`} className="font-semibold hover:underline">
                  {exercise.name}
                </Link>
                <p className="text-zinc-500 text-xs">{exercise.muscle_group}</p>
              </div>
              <Link href={`/exercises/${exercise.id}`} className="text-zinc-500 text-xs">History →</Link>
            </div>

            {lastSet ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Last time</span>
                  <span className="text-zinc-300">
                    {lastSet.is_bodyweight ? 'BW' : `${lastSet.weight_kg}kg`} × {lastSet.reps}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Today's target</span>
                  <span className="text-white font-medium">
                    {suggestion.weight ? `${suggestion.weight}kg` : 'BW'} × {suggestion.reps}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs mt-2">{suggestion.reason}</p>
              </div>
            ) : (
              <p className="text-zinc-500 text-xs mt-1">No data yet — start with a weight you can control for {exercise.rep_range_min}–{exercise.rep_range_max} reps</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
