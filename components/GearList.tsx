'use client'

import { useState, useEffect } from 'react'
import { X, Pencil, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Gear, PackEntry, parentOf, PARENT_CATEGORIES } from '@/types'
import EditGearModal from '@/components/EditGearModal'
import { useWeightUnit } from '@/lib/weight-unit-context'

interface Props {
  gears: Gear[]
  packItems: PackEntry[]
  onTogglePack: (gear: Gear) => void
  onUpdateQuantity: (gearId: string, quantity: number) => void
  onDelete: () => void
}

export default function GearList({ gears, packItems, onTogglePack, onUpdateQuantity, onDelete }: Props) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showHint, setShowHint] = useState(false)
  const { fmt } = useWeightUnit()

  useEffect(() => {
    const dismissed = localStorage.getItem('ninauu_pack_hint_dismissed')
    if (!dismissed) setShowHint(true)
  }, [])

  const dismissHint = () => {
    localStorage.setItem('ninauu_pack_hint_dismissed', '1')
    setShowHint(false)
  }

  const toggleCollapse = (parent: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(parent)) next.delete(parent)
      else next.add(parent)
      return next
    })
  }

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

  // カテゴリ順を維持してグループ化
  const grouped = PARENT_CATEGORIES
    .map(parent => ({ parent, items: gears.filter(g => parentOf(g.category) === parent) }))
    .filter(g => g.items.length > 0)

  const renderGearCard = (gear: Gear) => {
    const entry = packItems.find((e) => e.gear.id === gear.id)
    const inPack = !!entry
    return (
      <div
        key={gear.id}
        className={`bg-surface rounded-2xl border px-4 py-3 flex items-center gap-3 transition-colors ${
          inPack ? 'border-ink bg-fill' : 'border-line hover:border-ink-3'
        }`}
      >
        {/* Pack toggle */}
        <button
          onClick={() => onTogglePack(gear)}
          aria-label={inPack ? 'Remove from pack' : 'Add to pack'}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            inPack ? 'bg-ink border-ink text-surface' : 'border-line hover:border-ink'
          }`}
        >
          {inPack && (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink truncate leading-snug">{gear.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {gear.brand && <span className="text-xs text-ink-3 truncate">{gear.brand}</span>}
            {gear.brand && <span className="text-ink-3 text-xs">·</span>}
            <span className="text-xs text-ink-3">{gear.category}</span>
          </div>
        </div>

        {/* Quantity stepper (in-pack only) */}
        {inPack && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
              className="w-5 h-5 rounded-full bg-fill-2 text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-line transition-colors"
            >−</button>
            <span className="w-4 text-center text-xs font-semibold text-ink nums">{entry.quantity}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
              className="w-5 h-5 rounded-full bg-fill-2 text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-line transition-colors"
            >+</button>
          </div>
        )}

        {/* Weight */}
        <div className="text-right shrink-0 w-14">
          <span className="text-sm font-semibold text-ink nums">
            {inPack && entry.quantity > 1 ? fmt(gear.weight_g * entry.quantity) : fmt(gear.weight_g)}
          </span>
          {inPack && entry.quantity > 1 && (
            <p className="text-[10px] text-ink-3 nums">{fmt(gear.weight_g)} × {entry.quantity}</p>
          )}
        </div>

        {/* Edit & Delete */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setEditingGear(gear)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#D1D5DB] hover:text-ink transition-colors"
            aria-label="Edit gear"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            onClick={() => handleDelete(gear.id)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#D1D5DB] hover:text-red-400 transition-colors"
            aria-label="Delete gear"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Pack hint — 初回のみ表示 */}
      {showHint && (
        <div className="flex items-center justify-between bg-fill border border-line rounded-xl px-3 py-2 mb-3">
          <span className="text-xs text-ink-3">○  Tap the circle next to each item to add gear to your pack</span>
          <button onClick={dismissHint} aria-label="Dismiss hint" className="ml-2 shrink-0 text-ink-3 hover:text-ink">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* カテゴリアコーディオン */}
      <div>
        {grouped.length === 1 ? (
          // フィルター適用中 — ヘッダーなしでフラット表示
          <div className="space-y-1.5">{grouped[0].items.map(renderGearCard)}</div>
        ) : (
          grouped.map(({ parent, items }) => {
            const isCollapsed = collapsed.has(parent)
            const totalWeight = items.reduce((s, g) => s + g.weight_g, 0)
            const checkedCount = items.filter(g => packItems.some(e => e.gear.id === g.id)).length

            return (
              <div key={parent} className="mb-1">
                {/* アコーディオンヘッダー */}
                <button
                  onClick={() => toggleCollapse(parent)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between py-2 px-1 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">{parent}</span>
                    <span className="text-[10px] text-ink-3 bg-fill-2 rounded-full px-1.5 py-0.5 nums">{items.length}</span>
                    {checkedCount > 0 && (
                      <span className="text-[10px] text-surface bg-ink rounded-full px-1.5 py-0.5 nums">✓ {checkedCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-3 nums">{fmt(totalWeight)}</span>
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      aria-hidden
                      className={`text-ink-3 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </div>
                </button>

                {/* ギアリスト (max-height transition) */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'
                  }`}
                >
                  <div className="space-y-1.5 pb-3">
                    {items.map(renderGearCard)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

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
