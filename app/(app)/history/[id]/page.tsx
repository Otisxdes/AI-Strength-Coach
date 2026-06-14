import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getBestSet, estimateOneRM } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
        <Link href="/history" className="text-muted-foreground text-sm hover:text-foreground transition-colors">← History</Link>
        <h1 className="text-xl font-bold mt-1">{session.workout_type}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground text-sm">{formatDate(session.date)}</span>
          <Badge variant="secondary" className="text-xs">{session.sets?.length} sets</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {byExercise.map(({ exercise, sets }: { exercise: Exercise, sets: Set[] }) => {
          const best = getBestSet(sets)
          const e1RM = best ? estimateOneRM(best.weight_kg ?? 0, best.reps) : null
          return (
            <Card key={exercise.id}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/exercises/${exercise.id}`} className="font-semibold hover:underline underline-offset-4">
                      {exercise.name}
                    </Link>
                    <p className="text-muted-foreground text-xs mt-0.5">{exercise.muscle_group}</p>
                  </div>
                  {e1RM && (
                    <Badge variant="outline" className="text-xs">e1RM {e1RM}kg</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <Separator className="mb-3" />
                <div className="space-y-1.5">
                  {sets.map((set, i) => (
                    <div key={set.id} className="flex gap-4 text-sm items-center">
                      <span className="text-muted-foreground w-5 text-xs font-mono">{set.set_number || i + 1}</span>
                      <span className="font-medium">
                        {set.is_bodyweight ? 'BW' : `${set.weight_kg}kg`} × {set.reps} reps
                      </span>
                      {set.rir !== null && (
                        <Badge variant="secondary" className="text-xs">RIR {set.rir}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
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
