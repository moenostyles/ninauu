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
    <header className="bg-white border-b border-[#eeeeee] sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
        <Link href="/" className="hover:opacity-60 transition-opacity flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-ink tracking-tight">Ninauu</h1>
          <span className="hidden sm:inline text-[10px] text-ink-3 font-normal">Essentials, only.</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={`Switch to ${unit === 'g' ? 'oz' : 'g'}`}
            className="flex items-center text-[11px] font-medium rounded-full border border-[#ddd] overflow-hidden"
          >
            <span className={`px-2 py-0.5 transition-colors ${unit === 'g'  ? 'bg-ink text-white' : 'text-[#999]'}`}>g</span>
            <span className={`px-2 py-0.5 transition-colors ${unit === 'oz' ? 'bg-ink text-white' : 'text-[#999]'}`}>oz</span>
          </button>

          <NotificationBell userId={user.id} />

          <Link
            href={`/profile/${user.id}`}
            className="w-8 h-8 rounded-full overflow-hidden bg-fill-2 flex items-center justify-center shrink-0 hover:opacity-75 transition-opacity"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-ink">{initials}</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs text-[#bbb] hover:text-ink transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
