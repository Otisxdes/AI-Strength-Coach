import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getBestSet } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
        <p className="text-muted-foreground text-sm">{sessions?.length ?? 0} sessions</p>
      </div>

      {!sessions?.length && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">No sessions yet.</p>
            <Link href="/log" className={buttonVariants({ size: 'sm' })}>Log your first workout</Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sessions?.map(session => {
          const byExercise = groupByExercise(session.sets || [])
          return (
            <Link key={session.id} href={`/history/${session.id}`}>
              <Card className="hover:bg-card/80 transition-colors active:scale-[0.99]">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-semibold leading-none">{session.workout_type}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(session.date)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{session.sets?.length} sets</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <Separator className="mb-3" />
                  <div className="space-y-1.5">
                    {byExercise.slice(0, 3).map(({ exercise, sets }: { exercise: { id: string; name: string }, sets: Array<{ weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string }> }) => {
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
                    {byExercise.length > 3 && (
                      <p className="text-muted-foreground text-xs">+{byExercise.length - 3} more exercises</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
