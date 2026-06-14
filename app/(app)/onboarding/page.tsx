'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
    await supabase.from('profiles').upsert({
      user_id: user.id,
      name: form.name,
      age: parseInt(form.age) || null,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      training_experience: form.training_experience || 'intermediate',
      goal: form.goal || 'hypertrophy',
      split: form.split
    })
    await fetch('/api/exercises/seed', { method: 'POST' })
    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  const steps = [
    <div key={0} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">What's your name?</h2>
        <p className="text-muted-foreground text-sm mt-1">We'll use this to personalize your experience</p>
      </div>
      <div className="space-y-1.5">
        <Label>First name</Label>
        <Input autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your first name" className="text-base h-12" />
      </div>
    </div>,

    <div key={1} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Basic stats</h2>
        <p className="text-muted-foreground text-sm mt-1">Used to personalize suggestions. Skip if you prefer.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'age', label: 'Age', placeholder: '25' },
          { key: 'weight_kg', label: 'Weight (kg)', placeholder: '80' },
          { key: 'height_cm', label: 'Height (cm)', placeholder: '175' },
        ].map(f => (
          <div key={f.key} className={cn('space-y-1.5', f.key === 'age' && 'col-span-2')}>
            <Label>{f.label}</Label>
            <Input type="number" value={form[f.key as keyof typeof form] as string} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
          </div>
        ))}
      </div>
    </div>,

    <div key={2} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Training experience</h2>
        <p className="text-muted-foreground text-sm mt-1">Helps calibrate progression speed</p>
      </div>
      <div className="space-y-2">
        {EXPERIENCE.map(e => (
          <Card
            key={e.value}
            className={cn('cursor-pointer transition-colors', form.training_experience === e.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
            onClick={() => set('training_experience', e.value)}
          >
            <CardContent className="py-3 px-4">
              <p className="font-medium">{e.label}</p>
              <p className="text-muted-foreground text-sm">{e.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>,

    <div key={3} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Primary goal</h2>
        <p className="text-muted-foreground text-sm mt-1">Shapes rep ranges and progression advice</p>
      </div>
      <div className="space-y-2">
        {GOALS.map(g => (
          <Card
            key={g.value}
            className={cn('cursor-pointer transition-colors', form.goal === g.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
            onClick={() => set('goal', g.value)}
          >
            <CardContent className="py-3 px-4">
              <p className="font-medium">{g.label}</p>
              <p className="text-muted-foreground text-sm">{g.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>,
  ]

  const isLastStep = step === steps.length - 1
  const canNext = step === 0 ? form.name.length > 0 : true

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8 pt-4">
        {steps.map((_, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      <div className="flex-1">{steps[step]}</div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>Back</Button>
        )}
        <Button
          className="flex-1"
          onClick={isLastStep ? finish : () => setStep(s => s + 1)}
          disabled={!canNext || loading}
        >
          {loading ? 'Setting up…' : isLastStep ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
