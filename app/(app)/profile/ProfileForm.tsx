'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/lib/types'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    age: profile?.age?.toString() ?? '',
    height_cm: profile?.height_cm?.toString() ?? '',
    weight_kg: profile?.weight_kg?.toString() ?? '',
    training_experience: profile?.training_experience ?? 'intermediate',
    goal: profile?.goal ?? 'hypertrophy',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      user_id: user.id,
      ...form,
      age: parseInt(form.age) || null,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { key: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
          { key: 'age', label: 'Age', type: 'number', placeholder: '25' },
          { key: 'height_cm', label: 'Height (cm)', type: 'number', placeholder: '175' },
          { key: 'weight_kg', label: 'Body weight (kg)', type: 'number', placeholder: '80' },
        ].map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type={f.type}
              value={form[f.key as keyof typeof form]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Experience</Label>
          <select
            value={form.training_experience}
            onChange={e => set('training_experience', e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="beginner">Beginner (&lt;1 year)</option>
            <option value="intermediate">Intermediate (1–3 years)</option>
            <option value="advanced">Advanced (3+ years)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Goal</Label>
          <select
            value={form.goal}
            onChange={e => set('goal', e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="hypertrophy">Muscle Growth</option>
            <option value="strength">Strength</option>
            <option value="endurance">Endurance</option>
            <option value="general">General Fitness</option>
          </select>
        </div>
        <Button onClick={save} disabled={saving} className="w-full mt-1">
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
