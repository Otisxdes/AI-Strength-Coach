'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ParsedSet {
  exercise_name: string
  matched_exercise_id: string | null
  weight_kg: number | null
  reps: number
  is_bodyweight: boolean
  set_number: number
  notes: string | null
}

interface Exercise {
  id: string
  name: string
  muscle_group: string
}

const WORKOUT_TYPES = ['Chest + Biceps', 'Back + Triceps', 'Legs', 'Shoulders']

export default function LogPage() {
  const [input, setInput] = useState('')
  const [workoutType, setWorkoutType] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedSet[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from('exercises').select('id, name, muscle_group').then(({ data }) => {
      if (data) setExercises(data)
    })
  }, [])

  async function parseLog() {
    if (!input.trim()) return
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/parse-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, workout_type: workoutType })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setParsed(data.sets)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse')
    } finally {
      setParsing(false)
    }
  }

  async function saveSets() {
    if (!workoutType) { setError('Select a workout type first'); return }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const today = new Date().toISOString().split('T')[0]

      let { data: session } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('workout_type', workoutType)
        .single()

      if (!session) {
        const { data: newSession, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({ user_id: user.id, date: today, workout_type: workoutType })
          .select('id')
          .single()
        if (sessionError) throw sessionError
        session = newSession
      }

      const setsToInsert = []
      for (const p of parsed) {
        let exerciseId = p.matched_exercise_id
        if (!exerciseId) {
          const existing = exercises.find(e => e.name.toLowerCase() === p.exercise_name.toLowerCase())
          if (existing) {
            exerciseId = existing.id
          } else {
            const { data: newEx } = await supabase
              .from('exercises')
              .insert({
                user_id: user.id,
                name: p.exercise_name,
                muscle_group: 'Other',
                progression_type: 'double_progression',
                is_bodyweight: p.is_bodyweight
              })
              .select('id')
              .single()
            exerciseId = newEx?.id
          }
        }
        setsToInsert.push({
          user_id: user.id,
          workout_session_id: session!.id,
          exercise_id: exerciseId,
          set_number: p.set_number,
          weight_kg: p.weight_kg,
          reps: p.reps,
          is_bodyweight: p.is_bodyweight,
          notes: p.notes
        })
      }

      const { error: insertError } = await supabase.from('sets').insert(setsToInsert)
      if (insertError) throw insertError

      setSaved(true)
      setInput('')
      setParsed([])
      setTimeout(() => { setSaved(false); router.push('/history') }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function updateParsed(i: number, key: keyof ParsedSet, value: string | number | boolean | null) {
    setParsed(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: value } : p))
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">✅</div>
          <p className="font-semibold text-lg">Saved!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Log Sets</h1>
        <p className="text-muted-foreground text-sm">Type naturally</p>
      </div>

      {/* Workout type */}
      <div className="space-y-2">
        <Label>Workout type</Label>
        <div className="flex gap-2 flex-wrap">
          {WORKOUT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setWorkoutType(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                workoutType === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <Label>Your sets</Label>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Type your sets…\n\nExamples:\n• Bench press 50kg 7 reps\n• Lat pulldown 55x10, 55x9, 52.5x8\n• Pull ups 15 reps bodyweight`}
          rows={6}
          className="resize-none font-mono text-sm"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {/* Parse / Save */}
      {parsed.length === 0 ? (
        <div className="space-y-3">
          <Button
            onClick={parseLog}
            disabled={!input.trim() || parsing}
            className="w-full"
            size="lg"
          >
            {parsing ? 'Parsing with AI…' : 'Parse Sets'}
          </Button>
          <div className="text-center">
            <span className="text-muted-foreground text-xs">or </span>
            <button
              onClick={() => setParsed([{ exercise_name: '', matched_exercise_id: null, weight_kg: null, reps: 0, is_bodyweight: false, set_number: 1, notes: null }])}
              className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
            >
              add manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Review & Save</h2>
            <Button variant="ghost" size="sm" onClick={() => setParsed([])}>Edit input</Button>
          </div>

          {parsed.map((p, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Exercise</Label>
                    <Input
                      value={p.exercise_name}
                      onChange={e => updateParsed(i, 'exercise_name', e.target.value)}
                      className="h-8 text-sm"
                    />
                    {!p.matched_exercise_id && p.exercise_name && (
                      <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">New exercise</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setParsed(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-foreground mt-6 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                    <Input
                      type="number"
                      value={p.weight_kg ?? ''}
                      onChange={e => updateParsed(i, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      disabled={p.is_bodyweight}
                      className="h-8 w-24 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Reps</Label>
                    <Input
                      type="number"
                      value={p.reps}
                      onChange={e => updateParsed(i, 'reps', parseInt(e.target.value) || 0)}
                      className="h-8 w-20 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground pb-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.is_bodyweight}
                      onChange={e => updateParsed(i, 'is_bodyweight', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    BW
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={() => setParsed(prev => [...prev, { exercise_name: '', matched_exercise_id: null, weight_kg: null, reps: 0, is_bodyweight: false, set_number: prev.length + 1, notes: null }])}
            variant="outline"
            size="sm"
            className="w-full"
          >
            + Add another set
          </Button>

          <Button
            onClick={saveSets}
            disabled={saving || !workoutType}
            className="w-full"
            size="lg"
          >
            {saving ? 'Saving…' : `Save ${parsed.length} Set${parsed.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}
