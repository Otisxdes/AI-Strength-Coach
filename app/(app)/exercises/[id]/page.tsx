import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBestSet, estimateOneRM, getProgressionSuggestion, getTrend, formatDate } from '@/lib/utils'
import ExerciseChart from './ExerciseChart'
import type { Set } from '@/lib/types'

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!exercise) notFound()

  const { data: sets } = await supabase
    .from('sets')
    .select('*, workout_session:workout_sessions(date, workout_type)')
    .eq('user_id', user.id)
    .eq('exercise_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const allSets = (sets || []) as (Set & { workout_session: { date: string; workout_type: string } })[]

  // Group by session
  const sessions: Map<string, typeof allSets> = new Map()
  allSets.forEach(set => {
    const key = (set as unknown as { workout_session: { date: string } }).workout_session?.date || 'unknown'
    if (!sessions.has(key)) sessions.set(key, [])
    sessions.get(key)!.push(set)
  })
  const sessionList = Array.from(sessions.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  const best = getBestSet(allSets)
  const suggestion = getProgressionSuggestion(exercise, allSets)
  const trend = getTrend(sessionList.map(([, s]) => s))

  const trendLabel = { improving: '📈 Improving', stable: '➡️ Stable', declining: '📉 Declining' }[trend]

  // Chart data
  const chartData = sessionList.slice(0, 10).reverse().map(([date, sets]) => {
    const best = getBestSet(sets)
    return {
      date: formatDate(date),
      weight: best?.weight_kg ?? 0,
      reps: best?.reps ?? 0,
      e1rm: best ? estimateOneRM(best.weight_kg ?? 0, best.reps) : 0
    }
  })

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <Link href="/exercises" className="text-zinc-400 text-sm">← Library</Link>
        <h1 className="text-xl font-bold mt-1">{exercise.name}</h1>
        <div className="flex gap-2 items-center mt-1">
          <span className="text-zinc-400 text-sm">{exercise.muscle_group}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-sm">{exercise.rep_range_min}–{exercise.rep_range_max} reps</span>
          <span className="text-zinc-600">·</span>
          <span className="text-sm">{trendLabel}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-zinc-400 text-xs">Best Weight</p>
          <p className="font-bold">{best ? `${best.is_bodyweight ? 'BW' : best.weight_kg + 'kg'}` : '—'}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-zinc-400 text-xs">Best e1RM</p>
          <p className="font-bold">{best ? `${estimateOneRM(best.weight_kg ?? 0, best.reps)}kg` : '—'}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-zinc-400 text-xs">Sessions</p>
          <p className="font-bold">{sessionList.length}</p>
        </div>
      </div>

      {/* Next target */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Next Session Target</h2>
        <div className="flex justify-between items-center">
          <p className="text-white font-bold text-lg">
            {suggestion.weight ? `${suggestion.weight}kg` : 'BW'} × {suggestion.reps}
          </p>
        </div>
        <p className="text-zinc-400 text-sm mt-1">{suggestion.reason}</p>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-zinc-900 rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Progress</h2>
          <ExerciseChart data={chartData} />
        </div>
      )}

      {/* Session history */}
      <div className="space-y-3">
        <h2 className="font-semibold">Session History</h2>
        {sessionList.map(([date, sets]) => {
          const best = getBestSet(sets)
          return (
            <div key={date} className="bg-zinc-900 rounded-xl p-3">
              <p className="text-zinc-400 text-xs mb-2">{formatDate(date)}</p>
              <div className="space-y-1">
                {sets.map((set, i) => (
                  <div key={set.id} className="flex gap-3 text-sm">
                    <span className="text-zinc-500 w-5">{i + 1}</span>
                    <span>{set.is_bodyweight ? 'BW' : `${set.weight_kg}kg`} × {set.reps} reps</span>
                  </div>
                ))}
              </div>
              {best && (
                <p className="text-zinc-500 text-xs mt-2">Best: {best.is_bodyweight ? 'BW' : `${best.weight_kg}kg`} × {best.reps} = {estimateOneRM(best.weight_kg ?? 0, best.reps)}kg e1RM</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
