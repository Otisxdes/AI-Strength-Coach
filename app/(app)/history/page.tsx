import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getBestSet } from '@/lib/utils'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('*, sets(*, exercise:exercises(*))')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">History</h1>
        <p className="text-zinc-400 text-sm">{sessions?.length ?? 0} sessions</p>
      </div>

      {!sessions?.length && (
        <div className="bg-zinc-900 rounded-2xl p-6 text-center">
          <p className="text-zinc-400">No sessions yet.</p>
          <Link href="/log" className="text-white text-sm underline mt-2 block">Log your first workout</Link>
        </div>
      )}

      <div className="space-y-3">
        {sessions?.map(session => {
          const byExercise = groupByExercise(session.sets || [])
          return (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              className="block bg-zinc-900 rounded-2xl p-4 active:bg-zinc-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{session.workout_type}</p>
                  <p className="text-zinc-400 text-xs">{formatDate(session.date)}</p>
                </div>
                <span className="text-zinc-500 text-sm">{session.sets?.length} sets →</span>
              </div>
              <div className="space-y-1">
                {byExercise.slice(0, 3).map(({ exercise, sets }: { exercise: { id: string; name: string }, sets: Array<{ weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string }> }) => {
                  const best = getBestSet(sets as Parameters<typeof getBestSet>[0])
                  return (
                    <div key={exercise.id} className="flex justify-between text-sm">
                      <span className="text-zinc-300">{exercise.name}</span>
                      <span className="text-zinc-400">
                        {best ? `${best.is_bodyweight ? 'BW' : `${best.weight_kg}kg`} × ${best.reps}` : '—'}
                      </span>
                    </div>
                  )
                })}
                {byExercise.length > 3 && (
                  <p className="text-zinc-500 text-xs">+{byExercise.length - 3} more</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function groupByExercise(sets: Array<{ exercise_id: string; exercise: { id: string; name: string }; weight_kg: number | null; is_bodyweight: boolean; reps: number; id: string }>) {
  const map = new Map<string, { exercise: { id: string; name: string }; sets: typeof sets }>()
  sets.forEach(set => {
    if (!set.exercise) return
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, { exercise: set.exercise, sets: [] })
    map.get(set.exercise_id)!.sets.push(set)
  })
  return Array.from(map.values())
}
