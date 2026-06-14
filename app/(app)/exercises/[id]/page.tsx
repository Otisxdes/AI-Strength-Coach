import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBestSet, estimateOneRM, getProgressionSuggestion, getTrend, formatDate } from '@/lib/utils'
import ExerciseChart from './ExerciseChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

  const trendConfig = {
    improving: { label: 'Improving', variant: 'default' as const },
    stable: { label: 'Stable', variant: 'secondary' as const },
    declining: { label: 'Declining', variant: 'destructive' as const },
  }[trend]

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
        <Link href="/exercises" className="text-muted-foreground text-sm hover:text-foreground transition-colors">← Library</Link>
        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-xl font-bold">{exercise.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{exercise.muscle_group}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">{exercise.rep_range_min}–{exercise.rep_range_max} reps</span>
            </div>
          </div>
          <Badge variant={trendConfig.variant}>{trendConfig.label}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Best Weight', value: best ? (best.is_bodyweight ? 'BW' : `${best.weight_kg}kg`) : '—' },
          { label: 'Best e1RM', value: best ? `${estimateOneRM(best.weight_kg ?? 0, best.reps)}kg` : '—' },
          { label: 'Sessions', value: String(sessionList.length) },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="py-3 text-center">
              <p className="text-muted-foreground text-xs">{stat.label}</p>
              <p className="font-bold text-lg leading-tight mt-0.5">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next target */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">Next Session Target</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-2xl font-bold">
            {suggestion.weight ? `${suggestion.weight}kg` : 'BW'} × {suggestion.reps}
          </p>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{suggestion.reason}</p>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">e1RM Progress</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ExerciseChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Session history */}
      <div className="space-y-3">
        <h2 className="font-semibold">Session History</h2>
        {sessionList.map(([date, sets]) => {
          const best = getBestSet(sets)
          return (
            <Card key={date}>
              <CardContent className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-muted-foreground text-xs">{formatDate(date)}</p>
                  {best && (
                    <Badge variant="outline" className="text-xs">
                      e1RM {estimateOneRM(best.weight_kg ?? 0, best.reps)}kg
                    </Badge>
                  )}
                </div>
                <Separator className="mb-2" />
                <div className="space-y-1">
                  {sets.map((set, i) => (
                    <div key={set.id} className="flex gap-3 text-sm items-center">
                      <span className="text-muted-foreground font-mono text-xs w-4">{i + 1}</span>
                      <span>{set.is_bodyweight ? 'BW' : `${set.weight_kg}kg`} × {set.reps} reps</span>
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
