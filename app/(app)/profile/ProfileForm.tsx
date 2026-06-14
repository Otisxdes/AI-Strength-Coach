'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
    <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
      <h2 className="font-semibold">Profile</h2>
      {[
        { key: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
        { key: 'age', label: 'Age', type: 'number', placeholder: '25' },
        { key: 'height_cm', label: 'Height (cm)', type: 'number', placeholder: '175' },
        { key: 'weight_kg', label: 'Weight (kg)', type: 'number', placeholder: '80' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs text-zinc-400">{f.label}</label>
          <input
            type={f.type}
            value={form[f.key as keyof typeof form]}
            onChange={e => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none mt-1"
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-zinc-400">Experience</label>
        <select
          value={form.training_experience}
          onChange={e => set('training_experience', e.target.value)}
          className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none mt-1"
        >
          <option value="beginner">Beginner (&lt;1 year)</option>
          <option value="intermediate">Intermediate (1–3 years)</option>
          <option value="advanced">Advanced (3+ years)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-400">Goal</label>
        <select
          value={form.goal}
          onChange={e => set('goal', e.target.value)}
          className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none mt-1"
        >
          <option value="hypertrophy">Muscle Growth</option>
          <option value="strength">Strength</option>
          <option value="endurance">Endurance</option>
          <option value="general">General Fitness</option>
        </select>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-white text-black py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
