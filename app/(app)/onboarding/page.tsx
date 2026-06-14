'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const GOALS = [
  { value: 'hypertrophy', label: 'Build Muscle', desc: 'Maximize muscle size' },
  { value: 'strength', label: 'Get Stronger', desc: 'Maximize strength output' },
  { value: 'general', label: 'General Fitness', desc: 'Overall health & fitness' },
]

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', age: '', height_cm: '', weight_kg: '',
    training_experience: '', goal: '',
    split: ['Chest + Biceps', 'Back + Triceps', 'Legs', 'Shoulders']
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      name: form.name,
      age: parseInt(form.age) || null,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      training_experience: form.training_experience || 'intermediate',
      goal: form.goal || 'hypertrophy',
      split: form.split
    })

    // Seed exercises
    await fetch('/api/exercises/seed', { method: 'POST' })

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  const steps = [
    // Step 0: Name
    <div key={0} className="space-y-4">
      <h2 className="text-xl font-bold">What's your name?</h2>
      <input
        autoFocus
        type="text"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        placeholder="Your first name"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-zinc-600"
      />
    </div>,
    // Step 1: Stats
    <div key={1} className="space-y-4">
      <h2 className="text-xl font-bold">Basic stats</h2>
      <p className="text-zinc-400 text-sm">Used to personalize suggestions. Skip if you prefer.</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'age', label: 'Age', placeholder: '25', type: 'number' },
          { key: 'weight_kg', label: 'Weight (kg)', placeholder: '80', type: 'number' },
          { key: 'height_cm', label: 'Height (cm)', placeholder: '175', type: 'number' },
        ].map(f => (
          <div key={f.key} className={f.key === 'age' ? 'col-span-2' : ''}>
            <label className="block text-sm text-zinc-400 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={form[f.key as keyof typeof form] as string}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-zinc-600"
            />
          </div>
        ))}
      </div>
    </div>,
    // Step 2: Experience
    <div key={2} className="space-y-4">
      <h2 className="text-xl font-bold">Training experience</h2>
      <div className="space-y-3">
        {EXPERIENCE.map(e => (
          <button
            key={e.value}
            onClick={() => set('training_experience', e.value)}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              form.training_experience === e.value
                ? 'border-white bg-zinc-800'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <div className="font-medium">{e.label}</div>
            <div className="text-zinc-400 text-sm">{e.desc}</div>
          </button>
        ))}
      </div>
    </div>,
    // Step 3: Goal
    <div key={3} className="space-y-4">
      <h2 className="text-xl font-bold">Primary goal</h2>
      <div className="space-y-3">
        {GOALS.map(g => (
          <button
            key={g.value}
            onClick={() => set('goal', g.value)}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              form.goal === g.value
                ? 'border-white bg-zinc-800'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <div className="font-medium">{g.label}</div>
            <div className="text-zinc-400 text-sm">{g.desc}</div>
          </button>
        ))}
      </div>
    </div>,
  ]

  const isLastStep = step === steps.length - 1
  const canNext = step === 0 ? form.name.length > 0 : true

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-1 mb-8 pt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-zinc-800'}`}
          />
        ))}
      </div>

      <div className="flex-1">
        {steps[step]}
      </div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-medium"
          >
            Back
          </button>
        )}
        <button
          onClick={isLastStep ? finish : () => setStep(s => s + 1)}
          disabled={!canNext || loading}
          className="flex-1 bg-white text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? 'Setting up…' : isLastStep ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
