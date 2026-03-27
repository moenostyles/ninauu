'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Pencil, ChevronDown, MoreHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Gear, PackEntry, parentOf, PARENT_CATEGORIES } from '@/types'
import EditGearModal from '@/components/EditGearModal'
import { useWeightUnit } from '@/lib/weight-unit-context'
import { PARENT_COLOR } from '@/lib/category-colors'

interface Props {
  gears: Gear[]
  packItems: PackEntry[]
  onTogglePack: (gear: Gear) => void
  onUpdateQuantity: (gearId: string, quantity: number) => void
  onDelete: () => void
}

type DropdownPos = { gearId: string; top: number; right: number }

export default function GearList({ gears, packItems, onTogglePack, onUpdateQuantity, onDelete }: Props) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null)
  const [collapsed,   setCollapsed]   = useState<Set<string>>(new Set())
  const [showHint,    setShowHint]    = useState(false)
  const [swipedId,    setSwipedId]    = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const { fmt } = useWeightUnit()

  useEffect(() => {
    const dismissed = localStorage.getItem('ninauu_pack_hint_dismissed')
    if (!dismissed) setShowHint(true)
  }, [])

  // デスクトップドロップダウン：外クリックで閉じる
  useEffect(() => {
    if (!dropdownPos) return
    const close = () => setDropdownPos(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [dropdownPos])

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

  // デスクトップ「…」クリック：fixed位置でスマートdropup/dropdown
  const openDesktopMenu = (e: React.MouseEvent<HTMLButtonElement>, gearId: string) => {
    e.stopPropagation()
    if (dropdownPos?.gearId === gearId) { setDropdownPos(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const menuH = 92
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= menuH + 8 ? rect.bottom + 4 : rect.top - menuH - 4
    setDropdownPos({ gearId, top, right: window.innerWidth - rect.right })
  }

  if (gears.length === 0) {
    return (
      <p className="text-ink-3 text-sm py-12 text-center">
        No gear yet. Tap <span className="font-medium text-ink">+ Add</span> to start.
      </p>
    )
  }

  const grouped = PARENT_CATEGORIES
    .map(parent => ({ parent, items: gears.filter(g => parentOf(g.category) === parent) }))
    .filter(g => g.items.length > 0)

  const renderGearCard = (gear: Gear) => {
    const entry       = packItems.find((e) => e.gear.id === gear.id)
    const inPack      = !!entry
    const isOpen      = swipedId === gear.id
    const accentColor = PARENT_COLOR[parentOf(gear.category)] ?? '#9CA3AF'

    // スワイプ検出
    const onTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
        if (dx < 0) setSwipedId(gear.id)
        else        setSwipedId(null)
      }
    }

    // 数量ステッパー（コンパクト化）
    const stepper = inPack ? (
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
          className="w-6 h-6 rounded-full bg-[#ebebeb] text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-[#d5d5d5] transition-colors"
        >−</button>
        <span className="w-5 text-center text-[12px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.quantity}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
          className="w-6 h-6 rounded-full bg-[#ebebeb] text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-[#d5d5d5] transition-colors"
        >+</button>
      </div>
    ) : null

    // 重量（固定幅・モノスペース）
    const weight = (
      <div className="text-right shrink-0" style={{ width: '64px', minWidth: '64px' }}>
        <span
          className="text-[13px] font-medium"
          style={{ fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace", color: '#555', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
        >
          {inPack && entry.quantity > 1 ? fmt(gear.weight_g * entry.quantity) : fmt(gear.weight_g)}
        </span>
        {inPack && entry.quantity > 1 && (
          <p className="text-[10px] text-[#aaa] leading-tight" style={{ fontFamily: "'SF Mono', 'Menlo', monospace" }}>
            {fmt(gear.weight_g)}×{entry.quantity}
          </p>
        )}
      </div>
    )

    return (
      <div
        key={gear.id}
        // z-20 when swiped: elevates stacking context above overlay (z-10)
        // prevents animate-fade-slide-in from creating z-auto stacking context below overlay
        className={`relative overflow-hidden rounded-xl animate-fade-slide-in ${isOpen ? 'z-20' : ''}`}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* スワイプアクションボタン（モバイル） */}
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-stretch sm:hidden transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onTouchStart={e => { e.stopPropagation(); touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setEditingGear(gear); setSwipedId(null) }}
            className="w-[72px] bg-blue-500 text-white flex flex-col items-center justify-center gap-0.5 active:brightness-90"
          >
            <Pencil size={14} strokeWidth={2} />
            <span className="text-[11px] font-medium">Edit</span>
          </button>
          <button
            onClick={() => { handleDelete(gear.id); setSwipedId(null) }}
            className="w-[72px] bg-red-500 text-white flex flex-col items-center justify-center gap-0.5 active:brightness-90"
          >
            <X size={14} strokeWidth={2} />
            <span className="text-[11px] font-medium">Delete</span>
          </button>
        </div>

        {/* カード本体 */}
        <div
          className={`relative border px-3 py-2.5 sm:px-4 transition-transform duration-200 ease-out ${
            inPack
              ? 'border-[#e0e0e0] bg-[#fafafa]'
              : 'border-[#f0f0f0] bg-white hover:border-[#d0d0d0]'
          } ${isOpen ? '-translate-x-[144px] sm:translate-x-0' : 'translate-x-0'}`}
        >
          {/* カテゴリ別左ボーダーアクセント（チェック済みのみ） */}
          {inPack && (
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />
          )}

          {/* 行1: チェック + 品名 + 重量 + "…" */}
          <div className="flex items-center gap-3 pl-1 group">

            {/* チェックボックス */}
            <button
              onClick={() => onTogglePack(gear)}
              aria-label={inPack ? 'Remove from pack' : 'Add to pack'}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                inPack ? 'bg-ink border-ink text-surface' : 'border-[#ccc] hover:border-ink'
              }`}
            >
              {inPack && (
                <svg className="w-2.5 h-2.5 animate-scale-in" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* 品名（flex-1で残り幅を使い切る） */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate leading-snug text-[15px] text-ink">
                {gear.name}
              </p>
              <div className="hidden sm:flex items-center gap-1 mt-0.5">
                {gear.brand && <span className="truncate text-[12px] text-[#aaa]">{gear.brand}</span>}
                {gear.brand && <span className="text-[12px] text-[#ddd]">·</span>}
                <span className="shrink-0 text-[12px] text-[#aaa]">{gear.category}</span>
              </div>
            </div>

            {/* デスクトップ: ステッパー */}
            {inPack && <div className="hidden sm:flex">{stepper}</div>}

            {/* 重量 */}
            {weight}

            {/* "…" モバイル */}
            <button
              className="sm:hidden w-7 h-7 flex items-center justify-center rounded-lg text-[#bbb] active:bg-black/5 shrink-0"
              aria-label="More options"
              onTouchStart={e => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); setSwipedId(isOpen ? null : gear.id) }}
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>

            {/* "…" デスクトップ：hover表示 */}
            <button
              className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg text-[#ccc] hover:text-[#666] opacity-0 group-hover:opacity-100 active:bg-black/5 transition-all shrink-0"
              aria-label="More options"
              onClick={(e) => openDesktopMenu(e, gear.id)}
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>
          </div>

          {/* 行2（モバイルのみ）: ブランド · カテゴリ + ステッパー */}
          <div className="flex sm:hidden items-center justify-between mt-1 pl-8">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {gear.brand && <span className="truncate text-[12px] text-[#aaa]">{gear.brand}</span>}
              {gear.brand && <span className="text-[12px] text-[#ddd]">·</span>}
              <span className="shrink-0 text-[12px] text-[#aaa]">{gear.category}</span>
            </div>
            {stepper}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* スワイプ中：透明オーバーレイ z-10（swiped cardはz-20で上に出る） */}
      {swipedId && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onTouchStart={() => setSwipedId(null)}
          onClick={() => setSwipedId(null)}
        />
      )}

      {/* Pack hint */}
      {showHint && (
        <div className="flex items-center justify-between bg-fill border border-line rounded-xl px-3 py-2 mb-2">
          <span className="text-xs text-ink-3">○  Tap the circle to add gear to your pack</span>
          <button onClick={dismissHint} aria-label="Dismiss hint" className="ml-2 shrink-0 text-ink-3 hover:text-ink">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      <div>
        {grouped.length === 1 ? (
          <div className="space-y-[4px]">{grouped[0].items.map(renderGearCard)}</div>
        ) : (
          grouped.map(({ parent, items }) => {
            const isCollapsed  = collapsed.has(parent)
            const totalWeight  = items.reduce((s, g) => s + g.weight_g, 0)
            const checkedCount = items.filter(g => packItems.some(e => e.gear.id === g.id)).length
            const headerColor  = PARENT_COLOR[parent] ?? '#888'

            return (
              <div key={parent} className="mb-1">
                <button
                  onClick={() => toggleCollapse(parent)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between py-1.5 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: headerColor }} />
                    <span
                      className="font-semibold uppercase"
                      style={{ fontSize: '11px', color: '#999', letterSpacing: '0.08em' }}
                    >
                      {parent}
                    </span>
                    <span className="text-[10px] text-ink-3 bg-[#ebebeb] rounded-full px-1.5 py-0.5">{items.length}</span>
                    {checkedCount > 0 && (
                      <span className="text-[10px] text-surface bg-ink rounded-full px-1.5 py-0.5">✓ {checkedCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] text-[#aaa]"
                      style={{ fontFamily: "'SF Mono', 'Menlo', monospace", fontVariantNumeric: 'tabular-nums' }}
                    >
                      {fmt(totalWeight)}
                    </span>
                    <ChevronDown
                      size={12} strokeWidth={2.5} aria-hidden
                      className={`text-ink-3 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'
                }`}>
                  <div className="space-y-[4px] pb-2">
                    {items.map(renderGearCard)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* デスクトップドロップダウン（fixed / overflow-hiddenの外） */}
      {dropdownPos && (
        <div
          className="fixed z-50 bg-white border border-line rounded-xl shadow-xl overflow-hidden w-32 py-0.5"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const gear = gears.find(g => g.id === dropdownPos.gearId)
              if (gear) setEditingGear(gear)
              setDropdownPos(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-fill transition-colors"
          >
            <Pencil size={13} strokeWidth={2} className="text-ink-3 shrink-0" />
            Edit
          </button>
          <button
            onClick={() => { handleDelete(dropdownPos.gearId); setDropdownPos(null) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={13} strokeWidth={2} className="shrink-0" />
            Delete
          </button>
        </div>
      )}

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
