import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'
import SignOutButton from './SignOutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const { count: exerciseCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: sessionCount } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: setCount } = await supabase
    .from('sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-zinc-400 text-sm">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="font-bold text-xl">{sessionCount ?? 0}</p>
          <p className="text-zinc-400 text-xs">Sessions</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="font-bold text-xl">{setCount ?? 0}</p>
          <p className="text-zinc-400 text-xs">Sets</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 text-center">
          <p className="font-bold text-xl">{exerciseCount ?? 0}</p>
          <p className="text-zinc-400 text-xs">Exercises</p>
        </div>
      </div>

      <ProfileForm profile={profile} />

      <Link href="/exercises" className="block bg-zinc-900 rounded-xl px-4 py-3 text-sm">
        Exercise Library →
      </Link>

      <SignOutButton />
    </div>
  )
}
