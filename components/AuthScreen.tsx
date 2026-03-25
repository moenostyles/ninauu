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
    <div className="fixed inset-0 bg-fill flex flex-col items-center justify-center px-5 z-50">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <p className="text-2xl font-semibold text-ink tracking-tight">Ninauu</p>
          <p className="mt-1 text-xs text-ink-3 uppercase tracking-widest font-light">Essentials, only.</p>
        </div>

        {/* Mode toggle — same style as main tab control */}
        <div className="bg-fill-2 rounded-2xl p-1 flex mb-5">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setMessage('') }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                mode === m ? 'bg-ink text-surface shadow-sm' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full h-12 border border-line rounded-xl px-4 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-ink placeholder:text-ink-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full h-12 border border-line rounded-xl px-4 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-ink placeholder:text-ink-3"
          />

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          {message && <p className="text-green-600 text-xs px-1">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-ink text-surface text-sm font-semibold rounded-xl hover:bg-ink-2 disabled:opacity-40 transition-colors"
          >
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-ink-3">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full h-12 bg-surface border border-line text-ink text-sm font-medium rounded-xl hover:bg-fill transition-colors flex items-center justify-center gap-2.5"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

      </div>
    </div>
  )
}
