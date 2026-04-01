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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-5 z-50"
      style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      {/* Background texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="relative w-full animate-fade-in"
        style={{ maxWidth: '400px' }}
      >
        {/* Login Card */}
        <div
          className="bg-white px-8 py-8"
          style={{ borderRadius: '16px' }}
        >
          {/* Wordmark */}
          <div className="text-center mb-7">
            <p
              className="font-bold tracking-tight"
              style={{ fontSize: '28px', letterSpacing: '-0.03em', color: '#1C1C1E' }}
            >
              Ninauu
            </p>
            <p
              className="mt-1 uppercase font-normal"
              style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#888' }}
            >
              Essentials, only.
            </p>
          </div>

          {/* Google CTA — primary action */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 transition-colors"
            style={{
              height: '48px',
              background: '#1C1C1E',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3D3D3D')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1C1C1E')}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: '12px', color: '#aaa' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          </div>

          {/* Sign In / Sign Up tab toggle — underline style */}
          <div className="flex mb-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                className="flex-1 py-2 transition-colors"
                style={{
                  fontSize: '13px',
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? '#1C1C1E' : '#aaa',
                  borderBottom: mode === m ? '2px solid #1C1C1E' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full focus:outline-none transition-colors"
              style={{
                height: '44px',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '14px',
                color: '#1C1C1E',
                background: '#fafaf8',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1C1C1E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full focus:outline-none transition-colors"
              style={{
                height: '44px',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '14px',
                color: '#1C1C1E',
                background: '#fafaf8',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1C1C1E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            />

            {error && <p style={{ color: '#ef4444', fontSize: '12px', paddingLeft: '2px' }}>{error}</p>}
            {message && <p style={{ color: '#22c55e', fontSize: '12px', paddingLeft: '2px' }}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full transition-colors disabled:opacity-40"
              style={{
                height: '44px',
                background: '#FF6B35',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E85A20' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF6B35' }}
            >
              {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Tagline */}
          <p
            className="text-center mt-5"
            style={{ fontSize: '11px', color: '#bbb', letterSpacing: '0.02em' }}
          >
            Track your gear · Build packing lists · 900+ gear database
          </p>
        </div>
      </div>
    </div>
  )
}
