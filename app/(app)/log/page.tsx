'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const [listening, setListening] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
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

      // Get or create session
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

      // Create any unknown exercises
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

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Voice not supported in this browser'); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev ? prev + ' ' + transcript : transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function updateParsed(i: number, key: keyof ParsedSet, value: string | number | boolean | null) {
    setParsed(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: value } : p))
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-semibold text-lg">Saved!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Log Sets</h1>
        <p className="text-zinc-400 text-sm">Type or speak naturally</p>
      </div>

      {/* Workout type */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Workout type</label>
        <div className="flex gap-2 flex-wrap">
          {WORKOUT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setWorkoutType(t)}
              className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                workoutType === t ? 'border-white bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Type your sets…\n\nExamples:\n• Bench press 50kg 7 reps\n• Lat pulldown 55x10, 55x9, 52.5x8\n• Pull ups 15 reps bodyweight`}
          rows={6}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-zinc-600 resize-none"
        />
        <button
          onMouseDown={startVoice}
          onMouseUp={stopVoice}
          onTouchStart={startVoice}
          onTouchEnd={stopVoice}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${
            listening ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'
          }`}
        >
          🎤
        </button>
      </div>

      {listening && (
        <p className="text-center text-sm text-red-400 animate-pulse">Listening… release to stop</p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Parse button */}
      {parsed.length === 0 ? (
        <button
          onClick={parseLog}
          disabled={!input.trim() || parsing}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          {parsing ? 'Parsing…' : 'Parse Sets'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Review & Save</h2>
            <button onClick={() => setParsed([])} className="text-zinc-400 text-sm">Edit</button>
          </div>

          {parsed.map((p, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <p className="text-sm text-zinc-400">Exercise</p>
                  <input
                    value={p.exercise_name}
                    onChange={e => updateParsed(i, 'exercise_name', e.target.value)}
                    className="bg-transparent text-white text-sm w-full focus:outline-none border-b border-zinc-700 pb-1"
                  />
                  {!p.matched_exercise_id && (
                    <p className="text-yellow-500 text-xs mt-0.5">New exercise — will be created</p>
                  )}
                </div>
                <button onClick={() => setParsed(prev => prev.filter((_, idx) => idx !== i))} className="text-zinc-600 text-lg">×</button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">Weight</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={p.weight_kg ?? ''}
                      onChange={e => updateParsed(i, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      disabled={p.is_bodyweight}
                      className="bg-zinc-800 rounded-lg px-2 py-1 text-sm w-20 focus:outline-none disabled:opacity-50"
                    />
                    <span className="text-zinc-400 text-xs">kg</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">Reps</p>
                  <input
                    type="number"
                    value={p.reps}
                    onChange={e => updateParsed(i, 'reps', parseInt(e.target.value) || 0)}
                    className="bg-zinc-800 rounded-lg px-2 py-1 text-sm w-20 focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={p.is_bodyweight}
                      onChange={e => updateParsed(i, 'is_bodyweight', e.target.checked)}
                      className="w-3 h-3"
                    />
                    BW
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={saveSets}
            disabled={saving || !workoutType}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {saving ? 'Saving…' : `Save ${parsed.length} Set${parsed.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Quick manual entry */}
      {parsed.length === 0 && (
        <div className="text-center">
          <p className="text-zinc-500 text-xs">Or</p>
          <button
            onClick={() => {
              setParsed([{ exercise_name: '', matched_exercise_id: null, weight_kg: null, reps: 0, is_bodyweight: false, set_number: 1, notes: null }])
            }}
            className="text-zinc-400 text-sm underline mt-1"
          >
            Add manually
          </button>
        </div>
      )}
    </div>
  )
}
