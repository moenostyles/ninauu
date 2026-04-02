'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Gear } from '@/types'
import CategorySelect from '@/components/CategorySelect'

interface Props {
  gear: Gear
  onClose: () => void
  onSave: () => void
}

export default function EditGearModal({ gear, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: gear.name,
    brand: gear.brand,
    weight_g: String(gear.weight_g),
    category: gear.category,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.weight_g || isNaN(Number(form.weight_g))) { setError('Enter a valid weight.'); return }
    setSaving(true)
    const { error: dbError } = await supabase.from('gears').update({
      name: form.name.trim(), brand: form.brand.trim(),
      weight_g: Number(form.weight_g), category: form.category,
    }).eq('id', gear.id)
    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    onSave(); onClose()
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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as string, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-panel)', width: '100%', maxWidth: '360px', padding: '24px', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 'var(--text-weight)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Edit Gear</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Brand</label>
            <input type="text" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Weight (g) *</label>
            <input type="number" value={form.weight_g} onChange={e => setForm(p => ({ ...p, weight_g: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <CategorySelect value={form.category} onChange={(c) => setForm(p => ({ ...p, category: c }))} />
          </div>

          {error && <p style={{ fontSize: 'var(--text-sub)', color: 'var(--color-destructive)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-weight)', color: 'var(--text-primary)', background: 'var(--bg-elevated)', cursor: 'pointer', transition: 'border-color var(--transition)', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, padding: '10px', background: 'var(--color-accent)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-weight)', fontWeight: 500, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'opacity var(--transition)' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => (e.currentTarget.style.opacity = saving ? '0.5' : '1')}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
