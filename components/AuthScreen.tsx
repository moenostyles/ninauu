'use client'

import { supabase } from '@/lib/supabase'

export default function AuthScreen() {
  const handleOAuth = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--text-weight)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity var(--transition)',
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
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-panel)',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* Wordmark */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ fontSize: 'var(--text-logo)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Ninauu
            </p>
            <p style={{ marginTop: '4px', fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Essentials, only.
            </p>
          </div>

          {/* Description */}
          <p style={{ textAlign: 'center', fontSize: 'var(--text-weight)', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Track your gear · Build packing lists · 900+ gear database
          </p>

          {/* Google CTA */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            style={{
              ...buttonStyle,
              background: 'var(--color-accent)',
              color: 'var(--bg-primary)',
              marginBottom: '8px',
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

          {/* Apple CTA */}
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            style={{
              ...buttonStyle,
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} fill="currentColor">
              <path d="M17.05 13.5c-.91 2.92.37 5.65 2.85 6.75.56.3 1.14.5 1.73.58.12-1.2.08-2.4-.1-3.57-.37-2.6-1.38-5.08-3.48-6.76z"/>
              <path d="M12.08 5.22c.65-.75 1.48-1.32 2.4-1.62 2.4-.78 5.12-.2 6.56 1.89 1.44 2.09 1.01 5.18-1.04 6.71-1.54 1.09-3.50 1.08-5.04.02-1.54-1.06-2.36-3.06-1.88-5z"/>
              <path d="M6.3 7.75c1.23 1.74 1.48 4.09.57 6.15-.91 2.06-2.93 3.35-5.15 3.35-2.22 0-4.24-1.29-5.15-3.35C-4.26 11.84-3.99 9.49-2.76 7.75"/>
            </svg>
            Continue with Apple
          </button>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>
            Sign in with your account
          </p>
        </div>
      </div>
    </div>
  )
}
