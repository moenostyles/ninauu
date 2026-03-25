'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'

export default function Header() {
  const { user } = useAuth()
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

    // Realtime: プロフィール更新を検知してアバターを即反映
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

  return (
    <header className="bg-ink text-surface sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 py-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-surface">Ninauu</h1>
          <p className="text-[12px] text-ink-3">Essentials, only.</p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
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
