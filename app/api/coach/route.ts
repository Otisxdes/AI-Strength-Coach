import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getBestSet, estimateOneRM } from '@/lib/utils'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question } = await req.json()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  // Fetch context
  const [profileRes, exercisesRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('exercises').select('*').eq('user_id', user.id),
    supabase.from('workout_sessions').select('*, sets(*, exercise:exercises(*))').eq('user_id', user.id).order('date', { ascending: false }).limit(10)
  ])

  const profile = profileRes.data
  const exercises = exercisesRes.data || []
  const sessions = sessionsRes.data || []

  // Build context summary
  const exerciseSummaries = exercises.map(ex => {
    const allSets: Array<{ weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string; workout_session_id: string; user_id: string; exercise_id: string; set_number: number; rir: number | null; notes: string | null; created_at: string }> = []
    sessions.forEach(s => {
      if (s.sets) {
        s.sets.filter((set: { exercise_id: string }) => set.exercise_id === ex.id).forEach((set: { weight_kg: number | null; reps: number; is_bodyweight: boolean; id: string; workout_session_id: string; user_id: string; exercise_id: string; set_number: number; rir: number | null; notes: string | null; created_at: string }) => allSets.push(set))
      }
    })
    const best = getBestSet(allSets)
    return `${ex.name} (${ex.muscle_group}): ${best ? `Best set: ${best.weight_kg ?? 'BW'}kg × ${best.reps} reps (e1RM: ${estimateOneRM(best.weight_kg ?? 0, best.reps)}kg)` : 'No data yet'}`
  }).join('\n')

  const recentWorkouts = sessions.slice(0, 5).map(s => {
    const setsStr = s.sets?.map((set: { weight_kg: number | null; reps: number; is_bodyweight: boolean; exercise?: { name: string } }) =>
      `  - ${set.exercise?.name}: ${set.weight_kg ?? 'BW'}kg × ${set.reps}`
    ).join('\n') || ''
    return `${s.date} (${s.workout_type}):\n${setsStr}`
  }).join('\n\n')

  const systemPrompt = `You are a strength training coach AI. You only answer questions about training performance, progression, and exercise selection based on the user's actual data.

Rules:
- Be direct and data-driven
- No motivational fluff
- No bro-science
- Format responses cleanly for mobile: use bullet points or short paragraphs, avoid markdown tables
- Use **bold** only for exercise names or key numbers, not headers
- Keep responses concise — under 200 words unless the question requires detail
- Cite specific numbers from their data
- If asked about pain or injury, advise reducing load and consulting a professional
- Only discuss training topics (lifting, progression, performance)
- Decline questions unrelated to training

User profile: ${profile ? `${profile.name}, ${profile.age}y, ${profile.training_experience} lifter, goal: ${profile.goal}` : 'Unknown'}

Exercise library and bests:
${exerciseSummaries}

Recent workout history:
${recentWorkouts}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Invalid response')

    return NextResponse.json({ answer: content.text })
  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Failed to get coaching response' }, { status: 500 })
  }
}
