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
      <p className="text-center py-12" style={{ fontSize: '14px', color: '#8E8E93' }}>
        No gear yet. Tap <span className="font-medium" style={{ color: '#1C1C1E' }}>+ Add</span> to start.
      </p>
    )
  }

  const visibleGears = pendingDelete ? gears.filter(g => g.id !== pendingDelete.id) : gears

  const grouped = PARENT_CATEGORIES
    .map(parent => ({ parent, items: visibleGears.filter(g => parentOf(g.category) === parent) }))
    .filter(g => g.items.length > 0)

  // iOS-style grouped card rendering
  // first card in group: rounded top corners only
  // last card: rounded bottom corners only
  // middle cards: no radius
  // single card: all corners rounded
  const renderGearCard = (gear: Gear, idx: number, total: number) => {
    const entry       = packItems.find((e) => e.gear.id === gear.id)
    const inPack      = !!entry
    const isOpen      = swipedId === gear.id
    const accentColor = PARENT_COLOR[parentOf(gear.category)] ?? '#9CA3AF'

    const isFirst = idx === 0
    const isLast  = idx === total - 1
    const borderRadius = total === 1
      ? '10px'
      : isFirst
      ? '10px 10px 0 0'
      : isLast
      ? '0 0 10px 10px'
      : '0'

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

    const stepper = inPack ? (
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#555', fontSize: '12px', fontWeight: 700 }}
        >−</button>
        <span className="w-4 text-center text-xs font-semibold" style={{ color: '#1C1C1E' }}>{entry.quantity}</span>
        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#555', fontSize: '12px', fontWeight: 700 }}
        >+</button>
      </div>
    ) : null

    const weight = (
      <div className="text-right shrink-0" style={{ minWidth: '70px' }}>
        <span
          className="weight-mono"
          style={{ fontSize: '14px', color: '#555', display: 'block' }}
        >
          {inPack && entry.quantity > 1 ? fmt(gear.weight_g * entry.quantity) : fmt(gear.weight_g)}
        </span>
        {inPack && entry.quantity > 1 && (
          <span className="weight-mono" style={{ fontSize: '10px', color: '#aaa', display: 'block', lineHeight: 1.2 }}>
            {fmt(gear.weight_g)}×{entry.quantity}
          </span>
        )}
      </div>
    )

    return (
      <div
        key={gear.id}
        className={`relative overflow-hidden animate-fade-slide-in ${isOpen ? 'z-20' : ''}`}
        style={{ touchAction: 'pan-y', borderRadius }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipe action buttons (mobile) */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 flex items-stretch sm:hidden transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onTouchStart={e => { e.stopPropagation(); touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={e => e.stopPropagation()}
        >
          <button
            onTouchEnd={(e) => { e.stopPropagation(); setEditingGear(gear); setSwipedId(null) }}
            className="w-[72px] flex flex-col items-center justify-center gap-0.5 active:brightness-90"
            style={{ background: '#3B82F6', color: '#fff' }}
          >
            <Pencil size={14} strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Edit</span>
          </button>
          <button
            onTouchEnd={(e) => { e.stopPropagation(); handleDelete(gear.id, gear.name) }}
            className="w-[72px] flex flex-col items-center justify-center gap-0.5 active:brightness-90"
            style={{ background: '#EF4444', color: '#fff', borderRadius: isLast ? '0 0 10px 0' : isFirst && total === 1 ? '0 10px 10px 0' : '0' }}
          >
            <X size={14} strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Delete</span>
          </button>
        </div>

        {/* Card body */}
        <div
          className={`relative transition-transform duration-200 ease-out ${
            isOpen ? '-translate-x-[144px] sm:translate-x-0' : 'translate-x-0'
          }`}
          style={{
            border: '1px solid rgba(0,0,0,0.06)',
            background: inPack ? '#f7f7f5' : '#ffffff',
            padding: '12px 16px',
            borderRadius,
          }}
        >
          {/* Category left accent (checked items) */}
          {inPack && (
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{ width: '3px', backgroundColor: accentColor, borderRadius: `${borderRadius.split(' ')[0]} 0 0 ${borderRadius.split(' ')[borderRadius.split(' ').length - 1]}` }}
            />
          )}

          {/* Row 1: checkbox + name + weight + "..." */}
          <div className="flex items-center gap-1.5 pl-1">

            {/* Checkbox */}
            <button
              onClick={() => onTogglePack(gear)}
              aria-label={inPack ? 'Remove from pack' : 'Add to pack'}
              className="flex items-center justify-center shrink-0 transition-all"
              style={{
                width: '20px', height: '20px',
                borderRadius: '50%',
                border: inPack ? `2px solid ${accentColor}` : '2px solid rgba(0,0,0,0.15)',
                background: inPack ? accentColor : 'transparent',
                color: '#fff',
              }}
            >
              {inPack && (
                <svg className="animate-scale-in" width="10" height="10" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Gear name */}
            <div className="flex-1 min-w-0">
              <p
                className="truncate leading-snug"
                style={{ fontSize: '15px', fontWeight: 500, color: '#1C1C1E' }}
              >
                {gear.name}
              </p>
              <div className="hidden sm:flex items-center gap-1 mt-0.5">
                {gear.brand && (
                  <span className="truncate" style={{ fontSize: '12px', color: '#aaa' }}>{gear.brand}</span>
                )}
                {gear.brand && <span style={{ fontSize: '12px', color: '#ddd' }}>·</span>}
                <span className="shrink-0" style={{ fontSize: '12px', color: '#aaa' }}>{gear.category}</span>
              </div>
            </div>

            {/* Desktop: stepper */}
            {inPack && <div className="hidden sm:flex">{stepper}</div>}

            {/* Weight */}
            {weight}

            {/* "..." mobile: slide toggle */}
            <button
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg active:bg-black/5 shrink-0"
              style={{ color: '#bbb' }}
              aria-label="More options"
              onTouchEnd={(e) => { e.stopPropagation(); setSwipedId(isOpen ? null : gear.id) }}
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>

            {/* "..." desktop: hover-only */}
            <button
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg shrink-0 transition-all"
              style={{ color: 'transparent' }}
              aria-label="More options"
              onClick={(e) => openDesktopMenu(e, gear.id)}
              onMouseEnter={e => (e.currentTarget.style.color = '#8E8E93')}
              onMouseLeave={e => { if (dropdownPos?.gearId !== gear.id) e.currentTarget.style.color = 'transparent' }}
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Row 2 (mobile only): brand · category + stepper */}
          <div className="flex sm:hidden items-center justify-between mt-1 pl-7">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {gear.brand && (
                <span className="truncate" style={{ fontSize: '12px', color: '#aaa' }}>{gear.brand}</span>
              )}
              {gear.brand && <span style={{ fontSize: '12px', color: '#ddd' }}>·</span>}
              <span className="shrink-0" style={{ fontSize: '12px', color: '#aaa' }}>{gear.category}</span>
            </div>
            {stepper}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Swipe overlay: tap outside to close */}
      {swipedId && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onTouchStart={() => setSwipedId(null)}
        />
      )}

      {/* Pack hint — first time only */}
      {showHint && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 mb-2"
          style={{ background: '#fafaf8', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <span style={{ fontSize: '12px', color: '#8E8E93' }}>○  Tap the circle to add gear to your pack</span>
          <button onClick={dismissHint} aria-label="Dismiss hint" className="ml-2 shrink-0 hover:opacity-50 transition-opacity" style={{ color: '#8E8E93' }}>
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      <div>
        {grouped.length === 1 ? (
          // Single group: render cards without category header, with iOS grouping
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {grouped[0].items.map((g, i) => renderGearCard(g, i, grouped[0].items.length))}
          </div>
        ) : (
          grouped.map(({ parent, items }) => {
            const isCollapsed  = collapsed.has(parent)
            const totalWeight  = items.reduce((s, g) => s + g.weight_g, 0)
            const checkedCount = items.filter(g => packItems.some(e => e.gear.id === g.id)).length
            const headerColor  = PARENT_COLOR[parent] ?? '#888'

            return (
              <div key={parent} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(parent)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between py-1.5 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: headerColor }} />
                    <span
                      className="uppercase"
                      style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.08em' }}
                    >
                      {parent}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5"
                      style={{ fontSize: '10px', color: '#aaa', background: 'rgba(0,0,0,0.05)' }}
                    >
                      {items.length}
                    </span>
                    {checkedCount > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5"
                        style={{ fontSize: '10px', color: '#fff', background: '#1C1C1E' }}
                      >
                        ✓ {checkedCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="weight-mono" style={{ fontSize: '11px', color: '#aaa' }}>
                      {fmt(totalWeight)}
                    </span>
                    <ChevronDown
                      size={12} strokeWidth={2.5} aria-hidden
                      className={`transition-transform duration-150 ${isCollapsed ? '' : 'rotate-180'}`}
                      style={{ color: '#aaa' }}
                    />
                  </div>
                </button>

                {/* Cards — iOS grouped list style */}
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'
                }`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '4px' }}>
                    {items.map((g, i) => renderGearCard(g, i, items.length))}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop dropdown: z-40 overlay + z-50 dropdown */}
      {dropdownPos && (
        <>
          <div
            className="fixed inset-0 hidden sm:block"
            style={{ zIndex: 40 }}
            onClick={() => setDropdownPos(null)}
          />
          <div
            className="fixed overflow-hidden py-0.5"
            style={{
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 50,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              width: '128px',
            }}
          >
            <button
              onClick={() => {
                const gear = gears.find(g => g.id === dropdownPos.gearId)
                if (gear) setEditingGear(gear)
                setDropdownPos(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-[#fafaf8]"
              style={{ fontSize: '14px', color: '#1C1C1E' }}
            >
              <Pencil size={13} strokeWidth={2} style={{ color: '#8E8E93', flexShrink: 0 }} />
              Edit
            </button>
            <button
              onClick={() => {
                const g = gears.find(g => g.id === dropdownPos.gearId)
                handleDelete(dropdownPos.gearId, g?.name ?? '')
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-red-50"
              style={{ fontSize: '14px', color: '#EF4444' }}
            >
              <X size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
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

      {/* Delete Undo toast */}
      {pendingDelete && (
        <div
          className="fixed left-1/2 -translate-x-1/2 flex items-center gap-3 animate-fade-slide-in"
          style={{
            bottom: '24px',
            zIndex: 60,
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <span className="truncate opacity-80" style={{ maxWidth: '180px' }}>
            &ldquo;{pendingDelete.name}&rdquo; deleted
          </span>
          <button
            onClick={handleUndoDelete}
            className="shrink-0 font-semibold hover:opacity-80 transition-opacity"
            style={{ color: '#FF6B35' }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
