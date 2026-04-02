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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)' as string,
        background: 'var(--bg-primary)',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'border-color var(--transition)',
      }}
    >
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'baseline', gap: '8px', textDecoration: 'none', opacity: 1, transition: 'opacity var(--transition)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ fontSize: 'var(--text-logo)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Ninauu
          </span>
          <span className="hidden sm:inline" style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
            Essentials, only.
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* g / oz toggle */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${unit === 'g' ? 'oz' : 'g'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-default)',
              borderRadius: '999px',
              overflow: 'hidden',
              fontSize: 'var(--text-cat)',
              fontWeight: 500,
              transition: 'border-color var(--transition)',
            }}
          >
            {(['g', 'oz'] as const).map((u) => (
              <span
                key={u}
                style={{
                  padding: '2px 8px',
                  background: unit === u ? 'var(--text-primary)' : 'transparent',
                  color: unit === u ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  transition: 'background var(--transition), color var(--transition)',
                  lineHeight: 1.6,
                }}
              >{u}</span>
            ))}
          </button>

          <NotificationBell userId={user.id} />

          {/* Avatar */}
          <Link
            href={`/profile/${user.id}`}
            style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--border-default)',
              transition: 'opacity var(--transition)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 'var(--text-sub)', fontWeight: 600, color: 'var(--text-secondary)' }}>{initials}</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', transition: 'color var(--transition)', whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
