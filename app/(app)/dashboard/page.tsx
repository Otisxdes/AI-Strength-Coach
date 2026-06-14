import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getBestSet } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

  if (!profile || !profile.name) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.date === today)
  const splitTypes: string[] = profile.split || ['Chest + Biceps', 'Back + Triceps', 'Legs', 'Shoulders']

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-2">
        <p className="text-muted-foreground text-sm">Good {getGreeting()}</p>
        <h1 className="text-2xl font-bold">{profile.name?.split(' ')[0] ?? 'Athlete'}</h1>
      </div>

      {/* Quick Log CTA */}
      <Link href="/log" className={buttonVariants({ size: 'lg', className: 'w-full h-12 text-base font-semibold' })}>
        ➕ Log a Set
      </Link>

      {/* Today's workout */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Today's Workout</CardTitle>
            <Link href="/preview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preview →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todaySession ? (
            <div className="space-y-1">
              <p className="font-medium">{todaySession.workout_type}</p>
              <p className="text-muted-foreground text-sm">{todaySession.sets?.length} sets logged</p>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {splitTypes.map((type: string) => (
                <Link key={type} href={`/preview?type=${encodeURIComponent(type)}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                  {type}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last session */}
      {lastSession && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Last Session</CardTitle>
              <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                All →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{lastSession.workout_type}</Badge>
              <span className="text-muted-foreground text-xs">{formatDate(lastSession.date)}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              {groupByExercise(lastSession.sets || []).slice(0, 4).map(({ exercise, sets }: { exercise: { id: string; name: string }, sets: Array<{ weight_kg: number | null; is_bodyweight: boolean; reps: number; id: string }> }) => {
                const best = getBestSet(sets as Parameters<typeof getBestSet>[0])
                return (
                  <div key={exercise.id} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{exercise.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {best ? `${best.is_bodyweight ? 'BW' : `${best.weight_kg}kg`} × ${best.reps}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <p className="text-muted-foreground text-sm">No workouts yet.</p>
            <p className="text-muted-foreground text-xs">Log your first set to get started.</p>
          </CardContent>
        </Card>
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

function groupByExercise(sets: Array<{ exercise_id: string; exercise: { id: string; name: string }; weight_kg: number | null; is_bodyweight: boolean; reps: number; id: string }>) {
  const map = new Map<string, { exercise: { id: string; name: string }; sets: typeof sets }>()
  sets.forEach(set => {
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, { exercise: set.exercise, sets: [] })
    map.get(set.exercise_id)!.sets.push(set)
  })
  return Array.from(map.values())
}
