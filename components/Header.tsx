'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'
import { useWeightUnit } from '@/lib/weight-unit-context'

export default function Header() {
  const { user } = useAuth()
  const { unit, toggle } = useWeightUnit()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('?')

  useEffect(() => {
    if (!user) return

    // Fetch profile
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single()

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      } else {
        setAvatarUrl(user.user_metadata?.avatar_url ?? null)
      }

      const name = data?.display_name
        ?? (user.user_metadata?.full_name as string | undefined)
        ?? user.email
      setInitials(name?.charAt(0)?.toUpperCase() ?? '?')
    }

    load()

    // Realtime: detect profile updates and reflect avatar immediately
    const channel = supabase
      .channel('header-profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new?.avatar_url) setAvatarUrl(payload.new.avatar_url)
        if (payload.new?.display_name) setInitials(payload.new.display_name.charAt(0).toUpperCase())
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleLogout = () => supabase.auth.signOut()

  if (!user) return null

  return (
    <header className="bg-ink text-surface sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 py-2 flex items-center justify-between">
        <Link href="/" className="hover:opacity-75 transition-opacity">
          <h1 className="text-lg font-medium text-surface">Ninauu</h1>
          <p className="text-[12px] text-ink-3">Essentials, only.</p>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label={`Switch to ${unit === 'g' ? 'oz' : 'g'}`}
              className="flex items-center text-[11px] font-medium rounded-full border border-ink-2 overflow-hidden"
            >
              <span className={`px-2 py-0.5 transition-colors ${unit === 'g' ? 'bg-surface text-ink' : 'text-ink-3'}`}>g</span>
              <span className={`px-2 py-0.5 transition-colors ${unit === 'oz' ? 'bg-surface text-ink' : 'text-ink-3'}`}>oz</span>
            </button>
            <NotificationBell userId={user.id} />
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
