'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'
import { useWeightUnit } from '@/lib/weight-unit-context'

export default function Header() {
  const { user } = useAuth()
  const { unit, toggle } = useWeightUnit()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('?')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const router = useRouter()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!user) return null

  return (
    <header
      className="sticky top-0 transition-all duration-150"
      style={{
        background: '#ffffff',
        zIndex: 40,
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 hover:opacity-75 transition-opacity">
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: '18px', color: '#1C1C1E', letterSpacing: '-0.02em' }}
          >
            Ninauu
          </h1>
          <span
            className="hidden sm:inline"
            style={{ fontSize: '10px', color: '#8E8E93', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Essentials, only.
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label={`Switch to ${unit === 'g' ? 'oz' : 'g'}`}
              className="flex items-center overflow-hidden transition-colors"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '999px',
              }}
            >
              <span
                className="px-2 py-0.5 transition-colors"
                style={{
                  background: unit === 'g' ? '#1C1C1E' : 'transparent',
                  color: unit === 'g' ? '#fff' : '#8E8E93',
                }}
              >g</span>
              <span
                className="px-2 py-0.5 transition-colors"
                style={{
                  background: unit === 'oz' ? '#1C1C1E' : 'transparent',
                  color: unit === 'oz' ? '#fff' : '#8E8E93',
                }}
              >oz</span>
            </button>
            <NotificationBell userId={user.id} />
            <Link
              href={`/profile/${user.id}`}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 hover:opacity-75 transition-opacity"
              style={{ background: '#e5e5e5' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{initials}</span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="transition-colors whitespace-nowrap"
              style={{ fontSize: '12px', color: '#8E8E93' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1C1C1E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8E8E93')}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
