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
    const { error: dbError } = await supabase
      .from('gears')
      .update({
        name: form.name.trim(),
        brand: form.brand.trim(),
        weight_g: Number(form.weight_g),
        category: form.category,
      })
      .eq('id', gear.id)
    setSaving(false)

    if (dbError) { setError(dbError.message); return }
    onSave()
    onClose()
  }

  const inputClass = 'w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-ink mb-4">Edit Gear</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Brand</label>
            <input type="text" value={form.brand} onChange={(e) => setForm(p => ({ ...p, brand: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Weight (g) *</label>
            <input type="number" value={form.weight_g} onChange={(e) => setForm(p => ({ ...p, weight_g: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Category</label>
            <CategorySelect value={form.category} onChange={(c) => setForm(p => ({ ...p, category: c }))} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-line rounded-lg text-sm text-ink-3 hover:bg-fill transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-ink text-surface text-sm rounded-lg hover:bg-ink-2 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
