import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getBestSet, getProgressionSuggestion } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('workout_sessions')
      .select('*, sets(*, exercise:exercises(*))')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5)
  ])

  const profile = profileRes.data
  const sessions = sessionsRes.data || []
  const lastSession = sessions[0]

  // Check if profile is complete
  if (!profile || !profile.name) {
    redirect('/onboarding')
  }

  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.date === today)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-zinc-400 text-sm">Good {getGreeting()}</p>
        <h1 className="text-2xl font-bold">{profile.name?.split(' ')[0] ?? 'Athlete'}</h1>
      </div>

      {/* Quick Log CTA */}
      <Link
        href="/log"
        className="block bg-white text-black rounded-2xl p-4 text-center font-semibold text-lg active:scale-[0.98] transition-transform"
      >
        ➕ Log a Set
      </Link>

      {/* Today's preview */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Today's Workout</h2>
          <Link href="/preview" className="text-sm text-zinc-400">Preview →</Link>
        </div>
        {todaySession ? (
          <div>
            <p className="text-zinc-300 font-medium">{todaySession.workout_type}</p>
            <p className="text-zinc-400 text-sm">{todaySession.sets?.length} sets logged</p>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {(profile.split || ['Chest + Biceps', 'Back + Triceps', 'Legs', 'Shoulders']).map((type: string) => (
              <Link
                key={type}
                href={`/preview?type=${encodeURIComponent(type)}`}
                className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-xl text-sm"
              >
                {type}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Last Session</h2>
            <Link href="/history" className="text-sm text-zinc-400">All →</Link>
          </div>
          <p className="text-zinc-400 text-xs mb-2">{formatDate(lastSession.date)} · {lastSession.workout_type}</p>
          <div className="space-y-1">
            {groupByExercise(lastSession.sets || []).slice(0, 4).map(({ exercise, sets }: { exercise: { id: string; name: string }, sets: Array<{ weight_kg: number | null; is_bodyweight: boolean; reps: number }> }) => {
              const best = getBestSet(sets as Parameters<typeof getBestSet>[0])
              return (
                <div key={exercise.id} className="flex justify-between text-sm">
                  <span className="text-zinc-300">{exercise.name}</span>
                  <span className="text-zinc-400">
                    {best ? `${best.weight_kg ?? 'BW'}kg × ${best.reps}` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No sessions yet */}
      {sessions.length === 0 && (
        <div className="bg-zinc-900 rounded-2xl p-6 text-center">
          <p className="text-zinc-400 text-sm">No workouts yet.</p>
          <p className="text-zinc-500 text-xs mt-1">Log your first set to get started.</p>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function groupByExercise(sets: Array<{ exercise_id: string; exercise: { id: string; name: string }; weight_kg: number | null; is_bodyweight: boolean; reps: number }>) {
  const map = new Map<string, { exercise: { id: string; name: string }; sets: typeof sets }>()
  sets.forEach(set => {
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, { exercise: set.exercise, sets: [] })
    map.get(set.exercise_id)!.sets.push(set)
  })
  return Array.from(map.values())
}
