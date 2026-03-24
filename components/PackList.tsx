'use client'

import { useState } from 'react'
import { X, ChevronDown, Globe, Lock } from 'lucide-react'
import { Gear, PackEntry, SavedPack } from '@/types'

interface Props {
  items: PackEntry[]
  savedPacks: SavedPack[]
  onRemove: (gear: Gear) => void
  onUpdateQuantity: (gearId: string, quantity: number) => void
  onSave: (name: string, visibility: 'public' | 'private') => Promise<void>
  onLoad: (packId: string) => void
  onDeleteSaved: (packId: string) => void
  onToggleVisibility: (packId: string, visibility: 'public' | 'private') => void
}

function fmtWeight(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
}

export default function PackList({ items, savedPacks, onRemove, onUpdateQuantity, onSave, onLoad, onDeleteSaved, onToggleVisibility }: Props) {
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSavedPacks, setShowSavedPacks] = useState(false)
  const [packVisibility, setPackVisibility] = useState<'private' | 'public'>('private')

  const totalWeight = items.reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)

  const shelterWeight  = items.filter((e) => e.gear.category === 'Tent' || e.gear.category === 'Tarp').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const backpackWeight = items.filter((e) => e.gear.category === 'Backpack').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const sleepWeight    = items.filter((e) => e.gear.category === 'Sleeping Bag' || e.gear.category === 'Sleeping Mat').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const big3Weight     = shelterWeight + backpackWeight + sleepWeight

  const handleSave = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    await onSave(saveName.trim(), packVisibility)
    setSaving(false)
    setSaveName('')
    setPackVisibility('private')
    setShowSaveInput(false)
  }

  const empty = items.length === 0

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowSavedPacks((p) => !p)}
          className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center gap-1"
        >
          <ChevronDown size={14} strokeWidth={2} className={`transition-transform ${showSavedPacks ? 'rotate-180' : ''}`} />
          Saved packs{savedPacks.length > 0 ? ` (${savedPacks.length})` : ''}
        </button>

        {!empty && (
          <button
            onClick={() => setShowSaveInput((p) => !p)}
            className="text-xs px-3 py-1.5 border border-line rounded-lg text-ink-2 hover:bg-fill transition-colors"
          >
            {showSaveInput ? 'Cancel' : 'Save pack'}
          </button>
        )}
      </div>

      {/* Saved packs panel */}
      {showSavedPacks && (
        <div className="mb-4 bg-fill rounded-2xl p-3 space-y-1.5">
          {savedPacks.length === 0 ? (
            <p className="text-xs text-ink-3 text-center py-2">No saved packs yet.</p>
          ) : (
            savedPacks.map((pack) => (
              <div key={pack.id} className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-line">
                <span className="flex-1 text-sm font-medium text-ink truncate">{pack.name}</span>
                <button
                  onClick={() => onToggleVisibility(pack.id, pack.visibility === 'public' ? 'private' : 'public')}
                  className="text-xs px-2 py-0.5 rounded-full border border-line text-ink-3 hover:border-ink transition-colors flex items-center gap-1"
                  title="Toggle visibility"
                >
                  {pack.visibility === 'public' ? (
                    <><Globe size={11} strokeWidth={2} /> Public</>
                  ) : (
                    <><Lock size={11} strokeWidth={2} /> Private</>
                  )}
                </button>
                <button
                  onClick={() => { onLoad(pack.id); setShowSavedPacks(false) }}
                  className="text-xs px-2.5 py-1 bg-ink text-surface rounded-lg hover:bg-ink-2 transition-colors whitespace-nowrap"
                >
                  Load
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${pack.name}"?`)) onDeleteSaved(pack.id) }}
                  className="text-line hover:text-red-400 transition-colors"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Save input */}
      {showSaveInput && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Pack name (e.g. Summer Overnight)"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 border border-line rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-ink"
          />
          <button
            type="button"
            onClick={() => setPackVisibility(p => p === 'private' ? 'public' : 'private')}
            className="px-3 py-2 border border-line rounded-xl text-xs text-ink-3 hover:bg-fill transition-colors whitespace-nowrap flex items-center gap-1"
          >
            {packVisibility === 'public' ? (
              <><Globe size={11} strokeWidth={2} /> Public</>
            ) : (
              <><Lock size={11} strokeWidth={2} /> Private</>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            className="px-4 py-2 bg-ink text-surface text-sm rounded-xl hover:bg-ink-2 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {empty ? (
        <div className="text-center py-16">
          <p className="text-ink-3 text-sm">No items in your pack yet.</p>
          <p className="text-ink-3 text-xs mt-1">Go to Gear List and check items to add them.</p>
        </div>
      ) : (
        <>
          {/* Total weight */}
          <div className="bg-ink text-surface rounded-2xl px-6 py-5 mb-4">
            <p className="text-xs text-ink-3 uppercase tracking-widest">Total Weight</p>
            <p className="text-4xl font-bold mt-1 nums">{fmtWeight(totalWeight)}</p>
            <p className="text-xs text-ink-3 mt-2">
              {items.reduce((s, e) => s + e.quantity, 0)} items
              {totalWeight >= 1000 && <span className="ml-2 nums">{totalWeight}g</span>}
            </p>
          </div>

          {/* Big 3 */}
          {big3Weight > 0 && (
            <div className="bg-surface border border-line rounded-2xl px-5 py-4 mb-4 grid grid-cols-4 gap-2">
              <div>
                <p className="text-[10px] text-ink-3 uppercase tracking-wider">Shelter</p>
                <p className="text-sm font-semibold text-ink nums">{shelterWeight > 0 ? fmtWeight(shelterWeight) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-3 uppercase tracking-wider">Backpack</p>
                <p className="text-sm font-semibold text-ink nums">{backpackWeight > 0 ? fmtWeight(backpackWeight) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-3 uppercase tracking-wider">Sleep</p>
                <p className="text-sm font-semibold text-ink nums">{sleepWeight > 0 ? fmtWeight(sleepWeight) : '—'}</p>
              </div>
              <div className="border-l border-line pl-2">
                <p className="text-[10px] text-ink-3 uppercase tracking-wider">Big 3</p>
                <p className="text-sm font-bold text-ink nums">{fmtWeight(big3Weight)}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            {items.map(({ gear, quantity }) => (
              <div key={gear.id} className="bg-surface border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{gear.name}</p>
                  {gear.brand && <p className="text-xs text-ink-3">{gear.brand}</p>}
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateQuantity(gear.id, quantity - 1)}
                    className="w-6 h-6 rounded-full bg-fill text-ink-2 text-sm font-bold flex items-center justify-center hover:bg-fill-2 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-ink nums">{quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(gear.id, quantity + 1)}
                    className="w-6 h-6 rounded-full bg-fill text-ink-2 text-sm font-bold flex items-center justify-center hover:bg-fill-2 transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Weight */}
                <div className="text-right shrink-0 w-20">
                  <span className="text-sm font-semibold text-ink nums">
                    {quantity > 1 ? `${gear.weight_g * quantity}g` : `${gear.weight_g}g`}
                  </span>
                  {quantity > 1 && (
                    <p className="text-xs text-ink-3 nums">{gear.weight_g}g × {quantity}</p>
                  )}
                </div>

                <button
                  onClick={() => onRemove(gear)}
                  className="text-line hover:text-red-400 transition-colors shrink-0 p-0.5"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
