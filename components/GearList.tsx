'use client'

import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Gear, PackEntry } from '@/types'
import EditGearModal from '@/components/EditGearModal'

interface Props {
  gears: Gear[]
  packItems: PackEntry[]
  onTogglePack: (gear: Gear) => void
  onUpdateQuantity: (gearId: string, quantity: number) => void
  onDelete: () => void
}


export default function GearList({ gears, packItems, onTogglePack, onUpdateQuantity, onDelete }: Props) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gear?')) return
    await supabase.from('gears').delete().eq('id', id)
    onDelete()
  }

  if (gears.length === 0) {
    return (
      <p className="text-ink-3 text-sm py-12 text-center">
        No gear yet. Tap <span className="font-medium text-ink">+ Add</span> to start.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {gears.map((gear) => {
        const entry = packItems.find((e) => e.gear.id === gear.id)
        const inPack = !!entry

        return (
          <div
            key={gear.id}
            className={`bg-surface rounded-2xl border p-5 flex items-center gap-3 transition-colors shadow-sm ${
              inPack ? 'border-ink bg-fill' : 'border-line hover:border-black'
            }`}
          >
            {/* Pack toggle */}
            <button
              onClick={() => onTogglePack(gear)}
              title={inPack ? 'Remove from pack' : 'Add to pack'}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                inPack
                  ? 'bg-ink border-ink text-surface'
                  : 'border-line hover:border-ink'
              }`}
            >
              {inPack && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-ink truncate leading-snug">{gear.name}</p>
              {gear.brand && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{gear.brand}</p>
              )}
              <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-fill-2 text-ink-3 mt-1.5">
                {gear.category}
              </span>
            </div>

            {/* Weight badge */}
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-ink nums">
                {inPack && entry.quantity > 1 ? `${gear.weight_g * entry.quantity}g` : `${gear.weight_g}g`}
              </span>
              {inPack && entry.quantity > 1 && (
                <p className="text-xs text-ink-3 nums">{gear.weight_g}g × {entry.quantity}</p>
              )}
            </div>

            {/* Quantity stepper (in-pack only) */}
            {inPack && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
                  className="w-6 h-6 rounded-full bg-fill-2 text-ink-2 text-sm font-bold flex items-center justify-center hover:bg-line transition-colors"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold text-ink nums">{entry.quantity}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
                  className="w-6 h-6 rounded-full bg-fill-2 text-ink-2 text-sm font-bold flex items-center justify-center hover:bg-line transition-colors"
                >
                  +
                </button>
              </div>
            )}

            {/* Edit */}
            <button
              onClick={() => setEditingGear(gear)}
              className="text-line hover:text-ink transition-colors shrink-0 p-0.5"
              title="Edit"
            >
              <Pencil size={14} strokeWidth={2} />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(gear.id)}
              className="text-line hover:text-red-400 transition-colors shrink-0 p-0.5"
              title="Delete"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )
      })}

      {editingGear && (
        <EditGearModal
          gear={editingGear}
          onClose={() => setEditingGear(null)}
          onSave={() => { onDelete(); setEditingGear(null) }}
        />
      )}
    </div>
  )
}
