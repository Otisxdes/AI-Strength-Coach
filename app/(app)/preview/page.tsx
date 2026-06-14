import { createClient } from '@/lib/supabase/server'
import { getProgressionSuggestion } from '@/lib/utils'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
          <p className="text-muted-foreground text-sm">Choose today's workout</p>
        </div>
        <div className="space-y-2">
          {WORKOUT_TYPES.map(t => (
            <Link key={t} href={`/preview?type=${encodeURIComponent(t)}`}>
              <Card className="hover:bg-card/80 transition-colors active:scale-[0.99] cursor-pointer">
                <CardContent className="py-4 flex justify-between items-center">
                  <span className="font-medium">{t}</span>
                  <span className="text-muted-foreground">→</span>
                </CardContent>
              </Card>
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
          <Link href="/preview" className="text-muted-foreground text-sm hover:text-foreground">← Back</Link>
          <h1 className="text-xl font-bold mt-1">{type}</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">No exercises for this workout type.</p>
            <Link href="/exercises" className={buttonVariants({ size: 'sm', variant: 'outline' })}>Manage exercises</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    return { exercise: ex, suggestion, lastSet }
  }))

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <Link href="/preview" className="text-muted-foreground text-sm hover:text-foreground transition-colors">← Back</Link>
        <h1 className="text-xl font-bold mt-1">{type}</h1>
        <p className="text-muted-foreground text-sm">Today's targets</p>
      </div>

      <Link href={`/log?type=${encodeURIComponent(type)}`} className={buttonVariants({ size: 'lg', className: 'w-full' })}>➕ Start Logging</Link>

      <div className="space-y-3">
        {exercisePreviews.map(({ exercise, suggestion, lastSet }) => (
          <Card key={exercise.id}>
            <CardHeader className="pb-2 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/exercises/${exercise.id}`} className="font-semibold hover:underline underline-offset-4">
                    {exercise.name}
                  </Link>
                  <p className="text-muted-foreground text-xs mt-0.5">{exercise.muscle_group}</p>
                </div>
                <Link href={`/exercises/${exercise.id}`}>
                  <Badge variant="outline" className="text-xs hover:bg-secondary cursor-pointer">History →</Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {lastSet ? (
                <div className="space-y-2">
                  <Separator />
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last time</span>
                      <span className="font-mono text-xs">
                        {lastSet.is_bodyweight ? 'BW' : `${lastSet.weight_kg}kg`} × {lastSet.reps}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Today's target</span>
                      <span className="font-semibold text-foreground">
                        {suggestion.weight ? `${suggestion.weight}kg` : 'BW'} × {suggestion.reps}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{suggestion.reason}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs mt-1">
                  No data yet — start with a weight you can control for {exercise.rep_range_min}–{exercise.rep_range_max} reps
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
