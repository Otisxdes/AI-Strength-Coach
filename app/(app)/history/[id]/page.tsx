import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getBestSet, getProgressionSuggestion, estimateOneRM } from '@/lib/utils'
import type { Exercise, Set } from '@/lib/types'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*, sets(*, exercise:exercises(*))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()

  const byExercise = groupByExercise(session.sets || [])

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <Link href="/history" className="text-zinc-400 text-sm">← History</Link>
        <h1 className="text-xl font-bold mt-1">{session.workout_type}</h1>
        <p className="text-zinc-400 text-sm">{formatDate(session.date)}</p>
      </div>

      {byExercise.map(({ exercise, sets }: { exercise: Exercise, sets: Set[] }) => {
        const best = getBestSet(sets)
        const e1RM = best ? estimateOneRM(best.weight_kg ?? 0, best.reps) : null
        return (
          <div key={exercise.id} className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link href={`/exercises/${exercise.id}`} className="font-semibold text-white hover:underline">
                  {exercise.name}
                </Link>
                <p className="text-zinc-400 text-xs">{exercise.muscle_group}</p>
              </div>
              {e1RM && <span className="text-zinc-400 text-xs">e1RM: {e1RM}kg</span>}
            </div>
            <div className="space-y-1">
              {sets.map((set, i) => (
                <div key={set.id} className="flex gap-3 text-sm">
                  <span className="text-zinc-500 w-6">#{set.set_number || i + 1}</span>
                  <span className="text-zinc-300">
                    {set.is_bodyweight ? 'BW' : `${set.weight_kg}kg`} × {set.reps} reps
                  </span>
                  {set.rir !== null && <span className="text-zinc-500">RIR {set.rir}</span>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function groupByExercise(sets: Array<Set & { exercise: Exercise }>) {
  const map = new Map<string, { exercise: Exercise; sets: Set[] }>()
  sets.forEach(set => {
    if (!set.exercise) return
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, { exercise: set.exercise, sets: [] })
    map.get(set.exercise_id)!.sets.push(set)
  })
  return Array.from(map.values())
}
