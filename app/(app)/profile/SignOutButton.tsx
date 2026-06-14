'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 py-3 rounded-xl text-sm"
    >
      Sign Out
    </button>
  )
}
