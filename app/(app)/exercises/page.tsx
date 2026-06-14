import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AddExerciseForm from './AddExerciseForm'

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('muscle_group', { ascending: true })

  const byGroup: Record<string, typeof exercises> = {}
  exercises?.forEach(ex => {
    if (!byGroup[ex.muscle_group]) byGroup[ex.muscle_group] = []
    byGroup[ex.muscle_group]!.push(ex)
  })

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Exercise Library</h1>
        <p className="text-zinc-400 text-sm">{exercises?.length} exercises</p>
      </div>

      <AddExerciseForm />

      <div className="space-y-4">
        {Object.entries(byGroup).map(([group, exs]) => (
          <div key={group}>
            <h2 className="text-zinc-400 text-xs uppercase tracking-wide mb-2">{group}</h2>
            <div className="space-y-1">
              {exs?.map(ex => (
                <Link
                  key={ex.id}
                  href={`/exercises/${ex.id}`}
                  className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3 active:bg-zinc-800"
                >
                  <div>
                    <span className="text-sm font-medium">{ex.name}</span>
                    {ex.is_bodyweight && <span className="text-zinc-500 text-xs ml-2">BW</span>}
                  </div>
                  <span className="text-zinc-500 text-xs">{ex.rep_range_min}–{ex.rep_range_max} reps →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
