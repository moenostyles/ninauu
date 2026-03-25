'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trip } from '@/types'

interface Props {
  trip: Trip
  onClose: () => void
  onSave: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl leading-none transition-colors ${star <= (hovered || value) ? 'text-ink' : 'text-fill-2'}`}
        >★</button>
      ))}
    </div>
  )
}

export default function EditTripModal({ trip, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    memo: trip.memo,
    rating: trip.rating,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.destination.trim()) { setError('Destination is required.'); return }
    if (!form.start_date || !form.end_date) { setError('Dates are required.'); return }

    setSaving(true)
    const { error: dbError } = await supabase
      .from('trips')
      .update({
        destination: form.destination.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        memo: form.memo.trim(),
        rating: form.rating,
      })
      .eq('id', trip.id)
    setSaving(false)

    if (dbError) { setError(dbError.message); return }
    onSave()
    onClose()
  }

  const inputClass = 'w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-ink mb-4">Edit Trip</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Destination *</label>
            <input type="text" value={form.destination} onChange={(e) => setForm(p => ({ ...p, destination: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1">Start date *</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1">End date *</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Rating</label>
            <StarPicker value={form.rating} onChange={(v) => setForm(p => ({ ...p, rating: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Notes</label>
            <textarea value={form.memo} onChange={(e) => setForm(p => ({ ...p, memo: e.target.value }))} rows={2} onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }} className={`${inputClass} resize-none overflow-hidden`} />
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
