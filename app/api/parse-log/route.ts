import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, workout_type } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)

  const exerciseList = exercises?.map(e => `"${e.name}" (${e.muscle_group})`).join(', ') || ''

  const prompt = `You are a workout log parser. Parse the following gym log text into structured JSON.

Available exercises in the user's library: ${exerciseList}

Rules:
- Match exercise names to the closest exercise in the library (fuzzy match)
- If no match, use the name as-is
- Weight is in kg unless "lbs" is specified (convert to kg: lbs * 0.4536)
- "bodyweight" or "bw" means is_bodyweight=true, weight_kg=null
- Parse ALL sets mentioned (e.g. "3x8" = 3 sets of 8 reps)
- "x" between numbers means sets x reps
- Comma separated sets at same weight, e.g. "50x8, 50x7, 50x6" = 3 sets
- "each hand" or "each side" means that weight is already per-hand (no change)
- Return ONLY valid JSON, no explanation

Input: "${text}"

Return JSON array:
[
  {
    "exercise_name": "exact match from library or cleaned name",
    "matched_exercise_id": "id if matched to library, null if not",
    "weight_kg": number or null,
    "reps": number,
    "is_bodyweight": boolean,
    "set_number": number,
    "notes": string or null
  }
]`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Invalid response')

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed = JSON.parse(jsonMatch[0])

    // Match exercise IDs
    const enriched = parsed.map((set: { exercise_name: string; matched_exercise_id: string | null; [key: string]: unknown }) => {
      if (!set.matched_exercise_id && exercises) {
        const nameLower = set.exercise_name.toLowerCase()
        const match = exercises.find(e =>
          e.name.toLowerCase().includes(nameLower) ||
          nameLower.includes(e.name.toLowerCase()) ||
          levenshtein(e.name.toLowerCase(), nameLower) < 4
        )
        if (match) set.matched_exercise_id = match.id
      }
      return set
    })

    return NextResponse.json({ sets: enriched })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse log' }, { status: 500 })
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0).map((_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}
