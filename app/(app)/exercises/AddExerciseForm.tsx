'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
      <button onClick={() => setOpen(true)} className="w-full bg-zinc-900 border border-zinc-800 border-dashed rounded-xl py-3 text-zinc-400 text-sm">
        + Add Exercise
      </button>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold">New Exercise</h3>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Exercise name"
        className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none"
      />
      <select
        value={muscleGroup}
        onChange={e => setMuscleGroup(e.target.value)}
        className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none"
      >
        {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
      </select>
      <div className="flex gap-3">
        <div>
          <label className="text-xs text-zinc-400">Min reps</label>
          <input type="number" value={minReps} onChange={e => setMinReps(e.target.value)}
            className="w-16 bg-zinc-800 rounded-xl px-2 py-2 text-sm focus:outline-none block" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Max reps</label>
          <input type="number" value={maxReps} onChange={e => setMaxReps(e.target.value)}
            className="w-16 bg-zinc-800 rounded-xl px-2 py-2 text-sm focus:outline-none block" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={isBW} onChange={e => setIsBW(e.target.checked)} />
            Bodyweight
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 bg-zinc-800 py-2 rounded-xl text-sm">Cancel</button>
        <button onClick={add} disabled={!name || loading} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}
