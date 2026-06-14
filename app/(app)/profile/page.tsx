import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'
import SignOutButton from './SignOutButton'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const [{ count: exerciseCount }, { count: sessionCount }, { count: setCount }] = await Promise.all([
    supabase.from('exercises').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('sets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions', value: sessionCount ?? 0 },
          { label: 'Sets', value: setCount ?? 0 },
          { label: 'Exercises', value: exerciseCount ?? 0 },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="py-3 text-center">
              <p className="font-bold text-xl">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProfileForm profile={profile} />

      <Separator />

      <Link href="/exercises" className={buttonVariants({ variant: 'outline', className: 'w-full justify-between' })}>
        Exercise Library <span className="text-muted-foreground">→</span>
      </Link>

      <SignOutButton />
    </div>
  )
}
