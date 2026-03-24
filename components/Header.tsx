'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const { user } = useAuth()

  const handleLogout = () => supabase.auth.signOut()

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase()
    ?? user?.email?.charAt(0)?.toUpperCase()
    ?? '?'

  return (
    <header className="bg-ink text-surface sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 py-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-surface">Ninauu</h1>
          <p className="text-[12px] text-ink-3">Essentials, only.</p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} className="w-8 h-8 rounded-full overflow-hidden bg-ink-2 flex items-center justify-center shrink-0 hover:opacity-75 transition-opacity">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-surface">{initials}</span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-ink-3 hover:text-surface transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
