'use client'

import { useState } from 'react'
import { ChevronDown, Globe, Lock, Users, X } from 'lucide-react'
import { PackEntry, SavedPack, Visibility } from '@/types'
import { useWeightUnit } from '@/lib/weight-unit-context'

interface Props {
  items: PackEntry[]
  savedPacks: SavedPack[]
  onRemove: (gear: PackEntry['gear']) => void
  onClearAll: () => void
  onSave: (name: string, visibility: Visibility) => Promise<void>
  onLoad: (packId: string) => void
  onDeleteSaved: (packId: string) => void
  onToggleVisibility: (packId: string, visibility: Visibility) => void
}

function fmtWeightG(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
}

function nextVisibility(v: Visibility): Visibility {
  if (v === 'public') return 'followers'
  if (v === 'followers') return 'private'
  return 'public'
}

function VisibilityLabel({ v }: { v: Visibility }) {
  if (v === 'public') return <><Globe size={10} strokeWidth={2} /> Public</>
  if (v === 'followers') return <><Users size={10} strokeWidth={2} /> Followers</>
  return <><Lock size={10} strokeWidth={2} /> Private</>
}

export default function PackSummary({ items, savedPacks, onRemove, onClearAll, onSave, onLoad, onDeleteSaved, onToggleVisibility }: Props) {
  const { fmt: fmtWeight, unit } = useWeightUnit()
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveVisibility, setSaveVisibility] = useState<Visibility>('private')
  const [saving, setSaving] = useState(false)
  const [showSavedPacks, setShowSavedPacks] = useState(false)

  const totalWeight    = items.reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const shelterWeight  = items.filter(e => e.gear.category === 'Tent' || e.gear.category === 'Tarp').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const backpackWeight = items.filter(e => e.gear.category === 'Backpack').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const sleepWeight    = items.filter(e => e.gear.category === 'Sleeping Bag' || e.gear.category === 'Sleeping Mat').reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const big3Weight     = shelterWeight + backpackWeight + sleepWeight

  const handleSave = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    await onSave(saveName.trim(), saveVisibility)
    setSaving(false)
    setSaveName('')
    setSaveVisibility('private')
    setShowSaveInput(false)
  }

  const itemCount = items.reduce((s, e) => s + e.quantity, 0)
  const isEmpty = items.length === 0

  return (
    <div className="mb-4 space-y-2">
      {/* Total weight + Big 3 */}
      <div className="bg-ink text-surface rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-ink-3 uppercase tracking-widest">Total Weight</p>
            {!isEmpty && (
              <button
                onClick={onClearAll}
                className="text-[10px] text-ink-3 hover:text-surface transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <p className="text-3xl font-bold mt-0.5 nums leading-none">{fmtWeight(totalWeight)}</p>
          <p className="text-[10px] text-ink-3 mt-1">
            {isEmpty ? '0 items' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 border-l border-ink-2 pl-4">
          <div>
            <p className="text-[9px] text-ink-3 uppercase tracking-wider">Shelter</p>
            <p className="text-xs font-semibold nums">{shelterWeight > 0 ? fmtWeight(shelterWeight) : '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-ink-3 uppercase tracking-wider">Pack</p>
            <p className="text-xs font-semibold nums">{backpackWeight > 0 ? fmtWeight(backpackWeight) : '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-ink-3 uppercase tracking-wider">Sleep</p>
            <p className="text-xs font-semibold nums">{sleepWeight > 0 ? fmtWeight(sleepWeight) : '—'}</p>
          </div>
          <div className="border-l border-ink-2 pl-2">
            <p className="text-[9px] text-ink-3 uppercase tracking-wider">Big 3</p>
            <p className="text-xs font-bold nums">{big3Weight > 0 ? fmtWeight(big3Weight) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowSavedPacks(p => !p)}
          className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center gap-1"
        >
          <ChevronDown size={13} strokeWidth={2} className={`transition-transform ${showSavedPacks ? 'rotate-180' : ''}`} />
          Saved packs{savedPacks.length > 0 ? ` (${savedPacks.length})` : ''}
        </button>
        {!isEmpty && (
          <button
            onClick={() => setShowSaveInput(p => !p)}
            className="text-xs px-3 py-1.5 border border-line rounded-lg text-ink-2 hover:bg-fill transition-colors"
          >
            {showSaveInput ? 'Cancel' : 'Save pack'}
          </button>
        )}
      </div>

      {/* Saved packs panel */}
      {showSavedPacks && (
        <div className="bg-fill rounded-2xl p-3 space-y-1.5">
          {savedPacks.length === 0 ? (
            <p className="text-xs text-ink-3 text-center py-2">No saved packs yet.</p>
          ) : savedPacks.map(pack => (
            <div key={pack.id} className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-line">
              <span className="flex-1 text-sm font-medium text-ink truncate">{pack.name}</span>
              <button
                onClick={() => onToggleVisibility(pack.id, nextVisibility(pack.visibility ?? 'private'))}
                className="text-[10px] px-2 py-0.5 rounded-full border border-line text-ink-3 hover:border-ink transition-colors flex items-center gap-1"
              >
                <VisibilityLabel v={pack.visibility ?? 'private'} />
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
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save input */}
      {showSaveInput && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pack name"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 border border-line rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-ink"
          />
          <button
            type="button"
            onClick={() => setSaveVisibility(p => nextVisibility(p))}
            className="px-3 py-2 border border-line rounded-xl text-xs text-ink-3 hover:bg-fill transition-colors flex items-center gap-1"
          >
            <VisibilityLabel v={saveVisibility} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            className="px-4 py-2 bg-ink text-surface text-sm rounded-xl hover:bg-ink-2 disabled:opacity-40 transition-colors"
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
