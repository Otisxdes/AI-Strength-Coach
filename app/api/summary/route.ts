import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getProgressionSuggestion, getBestSet } from '@/lib/utils'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id } = await req.json()

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*, sets(*, exercise:exercises(*))')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Group sets by exercise
  const byExercise: Record<string, { exercise: { id: string; name: string; [key: string]: unknown }; sets: Array<{ weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string; workout_session_id: string; user_id: string; exercise_id: string; set_number: number; rir: number | null; notes: string | null; created_at: string }> }> = {}
  session.sets?.forEach((set: { exercise_id: string; exercise: { id: string; name: string; [key: string]: unknown }; weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string; workout_session_id: string; user_id: string; set_number: number; rir: number | null; notes: string | null; created_at: string }) => {
    if (!byExercise[set.exercise_id]) byExercise[set.exercise_id] = { exercise: set.exercise, sets: [] }
    byExercise[set.exercise_id].sets.push(set)
  })

  const summaryParts = []
  for (const { exercise, sets } of Object.values(byExercise)) {
    const best = getBestSet(sets)
    // Get previous session sets for this exercise
    const { data: prevSets } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_id', exercise.id)
      .neq('workout_session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(6)

    const prevBest = getBestSet(prevSets || [])
    const suggestion = getProgressionSuggestion(exercise as unknown as Parameters<typeof getProgressionSuggestion>[0], prevSets || [])

    summaryParts.push({
      exercise: exercise.name,
      today_best: best ? `${best.weight_kg ?? 'BW'}kg × ${best.reps}` : '—',
      prev_best: prevBest ? `${prevBest.weight_kg ?? 'BW'}kg × ${prevBest.reps}` : 'First time',
      next_target: `${suggestion.weight ?? 'BW'}kg × ${suggestion.reps}`,
      reason: suggestion.reason
    })
  }

  return NextResponse.json({ summary: summaryParts })
}
