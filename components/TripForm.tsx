'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Gear } from '@/types'

interface Props {
  packItems: Gear[]
  onSuccess: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl leading-none transition-colors ${
            star <= (hovered || value) ? 'text-ink' : 'text-fill-2'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function fmtWeight(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
}

export default function TripForm({ packItems, onSuccess }: Props) {
  const [form, setForm] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    total_weight_g: '',
    memo: '',
    rating: 0,
  })
  const [usePackList, setUsePackList] = useState(packItems.length > 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const packWeight = packItems.reduce((s, g) => s + g.weight_g, 0)
  const effectiveWeight = usePackList ? packWeight : (Number(form.total_weight_g) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.destination.trim()) { setError('Destination is required.'); return }
    if (!form.start_date) { setError('Start date is required.'); return }
    if (!form.end_date) { setError('End date is required.'); return }

    setSaving(true)

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        destination: form.destination.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        total_weight_g: effectiveWeight,
        memo: form.memo.trim(),
        rating: form.rating,
      })
      .select('id')
      .single()

    if (tripError) {
      setError(tripError.message)
      setSaving(false)
      return
    }

    if (usePackList && packItems.length > 0) {
      await supabase.from('trip_items').insert(
        packItems.map((g) => ({
          trip_id: tripData.id,
          gear_name: g.name,
          brand: g.brand,
          weight_g: g.weight_g,
          category: g.category,
        }))
      )
    }

    setSaving(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink-2 mb-4">New Trip</h2>

      <div className="space-y-4">
        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Destination *</label>
          <input
            type="text"
            placeholder="e.g. Mt. Fuji, Patagonia"
            value={form.destination}
            onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">Start date *</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1">End date *</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>
        </div>

        {/* Pack weight */}
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-2">Pack Weight</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUsePackList(true)}
              className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                usePackList
                  ? 'bg-ink text-white border-ink'
                  : 'border-line text-ink-3 hover:bg-fill'
              }`}
            >
              Use Pack List{packItems.length > 0 ? ` (${packItems.length} items)` : ''}
            </button>
            <button
              type="button"
              onClick={() => setUsePackList(false)}
              className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                !usePackList
                  ? 'bg-ink text-white border-ink'
                  : 'border-line text-ink-3 hover:bg-fill'
              }`}
            >
              Enter manually
            </button>
          </div>

          {usePackList ? (
            <div className="bg-fill rounded-lg px-3 py-2">
              {packItems.length === 0 ? (
                <p className="text-xs text-ink-3">
                  No items in Pack List. Go to Gear List and check items to add them.
                </p>
              ) : (
                <>
                  <div className="space-y-1 max-h-36 overflow-y-auto mb-2">
                    {packItems.map((g) => (
                      <div key={g.id} className="flex justify-between text-xs text-ink-2">
                        <span className="truncate">
                          {g.name}
                          {g.brand && ` · ${g.brand}`}
                        </span>
                        <span className="ml-2 shrink-0 text-ink-3">{g.weight_g}g</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-ink-2 border-t border-line pt-1.5">
                    <span>Total</span>
                    <span>{fmtWeight(packWeight)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <input
              type="number"
              placeholder="Total weight in grams"
              value={form.total_weight_g}
              onChange={(e) => setForm((p) => ({ ...p, total_weight_g: e.target.value }))}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Rating</label>
          <StarPicker value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Notes</label>
          <textarea
            placeholder="Weather, what worked, what didn't..."
            value={form.memo}
            onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
            rows={3}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink resize-none"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-2 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Trip'}
        </button>
      </div>
    </form>
  )
}
