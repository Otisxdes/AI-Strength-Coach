import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AddExerciseForm from './AddExerciseForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Exercise Library</h1>
        <p className="text-muted-foreground text-sm">{exercises?.length} exercises</p>
      </div>

      <AddExerciseForm />

      <div className="space-y-5">
        {Object.entries(byGroup).map(([group, exs]) => (
          <div key={group}>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-2">{group}</p>
            <Card>
              <CardContent className="py-2 px-0">
                {exs?.map((ex, i) => (
                  <div key={ex.id}>
                    <Link
                      href={`/exercises/${ex.id}`}
                      className="flex justify-between items-center px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ex.name}</span>
                        {ex.is_bodyweight && <Badge variant="outline" className="text-xs py-0">BW</Badge>}
                      </div>
                      <span className="text-muted-foreground text-xs font-mono">{ex.rep_range_min}–{ex.rep_range_max} →</span>
                    </Link>
                    {i < (exs?.length ?? 0) - 1 && <div className="h-px bg-border mx-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
