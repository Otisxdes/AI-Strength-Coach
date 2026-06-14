'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/log', label: 'Log', icon: '➕' },
  { href: '/history', label: 'History', icon: '📋' },
  { href: '/coach', label: 'Coach', icon: '🤖' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-zinc-950 border-t border-zinc-800 flex">
      {nav.map(item => {
        const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors',
              active ? 'text-white' : 'text-zinc-500'
            )}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
