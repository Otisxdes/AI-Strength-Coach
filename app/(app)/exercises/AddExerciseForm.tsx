'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Other']

export default function AddExerciseForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('Chest')
  const [isBW, setIsBW] = useState(false)
  const [minReps, setMinReps] = useState('8')
  const [maxReps, setMaxReps] = useState('12')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function add() {
    if (!name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('exercises').insert({
      user_id: user.id,
      name,
      muscle_group: muscleGroup,
      progression_type: 'double_progression',
      is_bodyweight: isBW,
      rep_range_min: parseInt(minReps),
      rep_range_max: parseInt(maxReps),
    })
    setLoading(false)
    setOpen(false)
    setName('')
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full border-dashed" onClick={() => setOpen(true)}>
        + Add Exercise
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">New Exercise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Exercise name" />
        </div>
        <div className="space-y-1.5">
          <Label>Muscle group</Label>
          <select
            value={muscleGroup}
            onChange={e => setMuscleGroup(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="space-y-1.5 flex-1">
            <Label>Min reps</Label>
            <Input type="number" value={minReps} onChange={e => setMinReps(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label>Max reps</Label>
            <Input type="number" value={maxReps} onChange={e => setMaxReps(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isBW} onChange={e => setIsBW(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-muted-foreground">Bodyweight exercise</span>
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={add} disabled={!name || loading}>
            {loading ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
