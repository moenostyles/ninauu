'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-card)',
    padding: '0 12px',
    fontSize: 'var(--text-gear)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition)',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 'var(--z-modal)' as string,
      }}
    >
      <div
        className="animate-fade-in"
        style={{ width: '100%', maxWidth: '380px' }}
      >
        {/* Card */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-panel)',
            padding: '32px',
          }}
        >
          {/* Wordmark */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: 'var(--text-logo)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Ninauu
            </p>
            <p style={{ marginTop: '4px', fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Essentials, only.
            </p>
          </div>

          {/* Google CTA — 最も目立つ白ボタン */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{
              width: '100%',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'var(--color-accent)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: 'var(--radius-card)',
              fontSize: 'var(--text-weight)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Sign In / Sign Up tab — underline style */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 'var(--text-weight)',
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: mode === m ? '2px solid var(--text-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: 'none',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: '2px',
                  borderBottomColor: mode === m ? 'var(--text-primary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'color var(--transition)',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />

            {error && (
              <p style={{ fontSize: 'var(--text-sub)', color: 'var(--color-destructive)', paddingLeft: '2px' }}>{error}</p>
            )}
            {message && (
              <p style={{ fontSize: 'var(--text-sub)', color: 'var(--color-success)', paddingLeft: '2px' }}>{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                marginTop: '4px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-weight)',
                fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity var(--transition), border-color var(--transition)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Tagline */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>
            Track your gear · Build packing lists · 900+ gear database
          </p>
        </div>
      </div>
    </div>
  )
}
