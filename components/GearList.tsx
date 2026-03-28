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
  const [swipedId,       setSwipedId]       = useState<string | null>(null)
  const [dropdownPos,    setDropdownPos]    = useState<DropdownPos | null>(null)
  const [pendingDelete,  setPendingDelete]  = useState<{ id: string; name: string } | null>(null)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const { fmt } = useWeightUnit()

  useEffect(() => {
    const dismissed = localStorage.getItem('ninauu_pack_hint_dismissed')
    if (!dismissed) setShowHint(true)
  }, [])

  // アンマウント時にdeleteタイマーをクリア
  useEffect(() => {
    return () => { if (deleteTimer.current) clearTimeout(deleteTimer.current) }
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

  const handleDelete = (id: string, name: string) => {
    // 即時削除（確認なし）→ 3秒間Undoトースト表示
    if (deleteTimer.current) clearTimeout(deleteTimer.current)
    setPendingDelete({ id, name })
    setSwipedId(null)
    setDropdownPos(null)
    deleteTimer.current = setTimeout(async () => {
      await supabase.from('gears').delete().eq('id', id)
      setPendingDelete(null)
      onDelete()
    }, 3000)
  }

  const handleUndoDelete = () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current)
    setPendingDelete(null)
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

  // pendingDelete中のギアはリストから一時的に除外（楽観的UI）
  const visibleGears = pendingDelete ? gears.filter(g => g.id !== pendingDelete.id) : gears

  const grouped = PARENT_CATEGORIES
    .map(parent => ({ parent, items: visibleGears.filter(g => parentOf(g.category) === parent) }))
    .filter(g => g.items.length > 0)

  const renderGearCard = (gear: Gear) => {
    const entry       = packItems.find((e) => e.gear.id === gear.id)
    const inPack      = !!entry
    const isOpen      = swipedId === gear.id
    const accentColor = PARENT_COLOR[parentOf(gear.category)] ?? '#9CA3AF'

    // スワイプ検出（縦スクロールと区別）
    const onTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
        if (dx < 0) setSwipedId(gear.id)   // 左スワイプ → 開く
        else        setSwipedId(null)        // 右スワイプ → 閉じる
      }
    }

    // 数量ステッパー
    const stepper = inPack ? (
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
          className="w-5 h-5 rounded-full bg-fill-2 text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-line transition-colors"
        >−</button>
        <span className="w-4 text-center text-xs font-semibold text-ink">{entry.quantity}</span>
        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
          className="w-5 h-5 rounded-full bg-fill-2 text-ink-2 text-xs font-bold flex items-center justify-center hover:bg-line transition-colors"
        >+</button>
      </div>
    ) : null

    // 重量（固定幅・tabular-nums）
    const weight = (
      <div className="text-right shrink-0" style={{ width: '64px', minWidth: '64px' }}>
        <span className="text-sm font-semibold tabular-nums" style={{ color: '#333' }}>
          {inPack && entry.quantity > 1 ? fmt(gear.weight_g * entry.quantity) : fmt(gear.weight_g)}
        </span>
        {inPack && entry.quantity > 1 && (
          <p className="text-[10px] text-ink-3 tabular-nums leading-tight">
            {fmt(gear.weight_g)}×{entry.quantity}
          </p>
        )}
      </div>
    )

    return (
      <div
        key={gear.id}
        className={`relative overflow-hidden rounded-xl animate-fade-slide-in ${isOpen ? 'z-20' : ''}`}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* スワイプアクションボタン（モバイル / z-20 でオーバーレイより上） */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 flex items-stretch sm:hidden transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onTouchStart={e => { e.stopPropagation(); touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={e => e.stopPropagation()}
        >
          <button
            onTouchEnd={(e) => { e.stopPropagation(); setEditingGear(gear); setSwipedId(null) }}
            className="w-[72px] bg-blue-500 text-white flex flex-col items-center justify-center gap-0.5 active:brightness-90"
          >
            <Pencil size={14} strokeWidth={2} />
            <span className="text-[11px] font-medium">Edit</span>
          </button>
          <button
            onTouchEnd={(e) => { e.stopPropagation(); handleDelete(gear.id, gear.name) }}
            className="w-[72px] bg-red-500 text-white flex flex-col items-center justify-center gap-0.5 active:brightness-90"
          >
            <X size={14} strokeWidth={2} />
            <span className="text-[11px] font-medium">Delete</span>
          </button>
        </div>

        {/* カード本体（スワイプで左スライド） */}
        <div
          className={`relative border px-3 py-2 sm:px-4 sm:py-2.5 sm:rounded-xl transition-transform duration-200 ease-out ${
            inPack ? 'border-ink/20 bg-fill' : 'border-line bg-surface hover:border-ink-3'
          } ${isOpen ? '-translate-x-[144px] sm:translate-x-0' : 'translate-x-0'}`}
        >
          {/* カテゴリ別左ボーダーアクセント（チェック済みのみ） */}
          {inPack && (
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />
          )}

          {/* 行1: チェック + 品名 + 重量 + "…" */}
          <div className="flex items-center gap-1.5 pl-1">

            {/* チェックボックス */}
            <button
              onClick={() => onTogglePack(gear)}
              aria-label={inPack ? 'Remove from pack' : 'Add to pack'}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                inPack ? 'bg-ink border-ink text-surface' : 'border-line hover:border-ink'
              }`}
            >
              {inPack && (
                <svg className="w-2.5 h-2.5 animate-scale-in" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* 品名（flex-1 で残り幅を使い切る） */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate leading-snug" style={{ fontSize: '15px', color: '#1A1A1A' }}>
                {gear.name}
              </p>
              <div className="hidden sm:flex items-center gap-1 mt-0.5">
                {gear.brand && <span className="truncate" style={{ fontSize: '13px', color: '#999' }}>{gear.brand}</span>}
                {gear.brand && <span style={{ fontSize: '13px', color: '#ccc' }}>·</span>}
                <span className="shrink-0" style={{ fontSize: '13px', color: '#999' }}>{gear.category}</span>
              </div>
            </div>

            {/* デスクトップ: ステッパー */}
            {inPack && <div className="hidden sm:flex">{stepper}</div>}

            {/* 重量 */}
            {weight}

            {/* "…" モバイル：スライドトグル */}
            <button
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#999] active:bg-black/5 shrink-0"
              aria-label="More options"
              onTouchEnd={(e) => { e.stopPropagation(); setSwipedId(isOpen ? null : gear.id) }}
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>

            {/* "…" デスクトップ：常時表示（薄色）→ hover で濃く */}
            <button
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-[#ccc] hover:text-[#555] hover:bg-black/5 active:bg-black/8 transition-all shrink-0"
              aria-label="More options"
              onClick={(e) => openDesktopMenu(e, gear.id)}
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          </div>

          {/* 行2（モバイルのみ）: ブランド · カテゴリ + ステッパー */}
          <div className="flex sm:hidden items-center justify-between mt-1 pl-7">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {gear.brand && <span className="truncate" style={{ fontSize: '13px', color: '#999' }}>{gear.brand}</span>}
              {gear.brand && <span style={{ fontSize: '13px', color: '#ccc' }}>·</span>}
              <span className="shrink-0" style={{ fontSize: '13px', color: '#999' }}>{gear.category}</span>
            </div>
            {stepper}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* スワイプ中：透明オーバーレイでタップ外を閉じる（document touchstart 不要） */}
      {swipedId && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onTouchStart={() => setSwipedId(null)}
        />
      )}

      {/* Pack hint — 初回のみ */}
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
          <div className="space-y-1">{grouped[0].items.map(renderGearCard)}</div>
        ) : (
          grouped.map(({ parent, items }) => {
            const isCollapsed  = collapsed.has(parent)
            const totalWeight  = items.reduce((s, g) => s + g.weight_g, 0)
            const checkedCount = items.filter(g => packItems.some(e => e.gear.id === g.id)).length
            const headerColor  = PARENT_COLOR[parent] ?? '#888'

            return (
              <div key={parent} className="mb-0.5">
                <button
                  onClick={() => toggleCollapse(parent)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between py-1.5 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: headerColor }} />
                    <span className="font-bold uppercase" style={{ fontSize: '11px', color: '#888', letterSpacing: '0.05em' }}>
                      {parent}
                    </span>
                    <span className="text-[10px] text-ink-3 bg-fill-2 rounded-full px-1.5 py-0.5">{items.length}</span>
                    {checkedCount > 0 && (
                      <span className="text-[10px] text-surface bg-ink rounded-full px-1.5 py-0.5">✓ {checkedCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-3 tabular-nums">{fmt(totalWeight)}</span>
                    <ChevronDown
                      size={12} strokeWidth={2.5} aria-hidden
                      className={`text-ink-3 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'
                }`}>
                  <div className="space-y-1 pb-2">
                    {items.map(renderGearCard)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* デスクトップドロップダウン：外クリック閉じ用オーバーレイ（z-40）+ ドロップダウン本体（z-50） */}
      {dropdownPos && (
        <>
          <div
            className="fixed inset-0 z-40 hidden sm:block"
            onClick={() => setDropdownPos(null)}
          />
          <div
            className="fixed z-50 bg-white border border-line rounded-xl shadow-xl overflow-hidden w-32 py-0.5"
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
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
              onClick={() => { const g = gears.find(g => g.id === dropdownPos.gearId); handleDelete(dropdownPos.gearId, g?.name ?? ''); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={13} strokeWidth={2} className="shrink-0" />
              Delete
            </button>
          </div>
        </>
      )}

      {editingGear && (
        <EditGearModal
          gear={editingGear}
          onClose={() => setEditingGear(null)}
          onSave={() => { onDelete(); setEditingGear(null) }}
        />
      )}

      {/* 削除Undoトースト */}
      {pendingDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-slide-in">
          <span className="truncate max-w-[180px] opacity-80">
            &ldquo;{pendingDelete.name}&rdquo; deleted
          </span>
          <button
            onClick={handleUndoDelete}
            className="font-semibold text-white underline underline-offset-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
