import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_EXERCISES } from '@/lib/default-exercises'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('exercises').select('id').eq('user_id', user.id).limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Exercises already exist' })
  }

  const toInsert = DEFAULT_EXERCISES.map(ex => ({ ...ex, user_id: user.id }))
  const { error } = await supabase.from('exercises').insert(toInsert)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Exercises seeded', count: toInsert.length })
}
