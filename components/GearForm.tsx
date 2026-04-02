'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import CategorySelect from '@/components/CategorySelect'

interface Props {
  onSuccess: () => void
  initialName?: string
}

export default function GearForm({ onSuccess, initialName = '' }: Props) {
  const [form, setForm] = useState({ name: initialName, brand: '', weight_g: '', category: 'Others' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [allBrands, setAllBrands] = useState<string[]>([])
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const brandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('gear_catalog').select('brand').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map((d) => d.brand).filter(Boolean))].sort() as string[]
        setAllBrands(unique)
      }
    })
  }, [])

  useEffect(() => {
    const q = form.brand.trim().toLowerCase()
    if (q) {
      const filtered = allBrands.filter(b => b.toLowerCase().includes(q))
      setBrandSuggestions(filtered.slice(0, 8))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [form.brand, allBrands])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.weight_g || isNaN(Number(form.weight_g)) || Number(form.weight_g) < 0) { setError('Enter a valid weight.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: dbError } = await supabase.from('gears').insert({
      name: form.name.trim(), brand: form.brand.trim(),
      weight_g: Number(form.weight_g), category: form.category, user_id: user?.id,
    })
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    onSuccess()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-card)',
    padding: '0 12px',
    fontSize: 'var(--text-gear)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition)',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-cat)',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-panel)', padding: '16px' }}
    >
      <p style={{ fontSize: 'var(--text-weight)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Add Manually</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Name */}
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            placeholder="e.g. Tarptent Notch"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {/* Brand with autocomplete */}
        <div>
          <label style={labelStyle}>Brand</label>
          <div ref={brandRef} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g. Tarptent"
              value={form.brand}
              onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              onFocus={() => { if (brandSuggestions.length > 0) setShowSuggestions(true) }}
              style={inputStyle}
              onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
            {showSuggestions && (
              <ul style={{
                position: 'absolute', zIndex: 'var(--z-popover)' as string, left: 0, right: 0,
                marginTop: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-card)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                maxHeight: '192px', overflowY: 'auto', padding: '2px 0', listStyle: 'none', margin: '4px 0 0',
              }}>
                {brandSuggestions.map((b) => (
                  <li
                    key={b}
                    onMouseDown={(e) => { e.preventDefault(); setForm(p => ({ ...p, brand: b })); setShowSuggestions(false) }}
                    style={{ padding: '8px 12px', fontSize: 'var(--text-gear)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background var(--transition)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Category</label>
          <CategorySelect value={form.category} onChange={(c) => setForm(p => ({ ...p, category: c }))} />
        </div>

        {/* Weight */}
        <div>
          <label style={labelStyle}>Weight (g) *</label>
          <input
            type="number"
            placeholder="0"
            value={form.weight_g}
            onChange={e => setForm(p => ({ ...p, weight_g: e.target.value }))}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 'var(--text-sub)', color: 'var(--color-destructive)', marginTop: '8px' }}>{error}</p>}

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '8px 20px', background: 'var(--color-accent)', color: 'var(--bg-primary)', fontSize: 'var(--text-weight)', fontWeight: 500, border: 'none', borderRadius: 'var(--radius-card)', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'opacity var(--transition)' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => (e.currentTarget.style.opacity = saving ? '0.5' : '1')}
        >
          {saving ? 'Saving…' : 'Save Gear'}
        </button>
      </div>
    </form>
  )
}
