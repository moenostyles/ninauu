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
  const [swipedId,      setSwipedId]      = useState<string | null>(null)
  const [dropdownPos,   setDropdownPos]   = useState<DropdownPos | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const deleteTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX  = useRef<number>(0)
  const touchStartY  = useRef<number>(0)
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

  // Desktop "…" — smart dropup/dropdown
  const openDesktopMenu = (e: React.MouseEvent<HTMLButtonElement>, gearId: string) => {
    e.stopPropagation()
    if (dropdownPos?.gearId === gearId) { setDropdownPos(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const menuH = 88
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= menuH + 8 ? rect.bottom + 4 : rect.top - menuH - 4
    setDropdownPos({ gearId, top, right: window.innerWidth - rect.right })
  }

  if (gears.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0' }}>
        No gear yet. Tap <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>+ Add</span> to start.
      </p>
    )
  }

  const visibleGears = pendingDelete ? gears.filter(g => g.id !== pendingDelete.id) : gears

  const grouped = PARENT_CATEGORIES
    .map(parent => ({ parent, items: visibleGears.filter(g => parentOf(g.category) === parent) }))
    .filter(g => g.items.length > 0)

  // iOS-style grouped card: first=top-radius, last=bottom-radius, single=all-radius
  const cardRadius = (idx: number, total: number): string => {
    if (total === 1) return 'var(--radius-card)'
    if (idx === 0)   return 'var(--radius-card) var(--radius-card) 0 0'
    if (idx === total - 1) return '0 0 var(--radius-card) var(--radius-card)'
    return '0'
  }

  const renderGearCard = (gear: Gear, idx: number, total: number) => {
    const entry       = packItems.find((e) => e.gear.id === gear.id)
    const inPack      = !!entry
    const isOpen      = swipedId === gear.id
    const accentColor = PARENT_COLOR[parentOf(gear.category)] ?? 'var(--cat-others)'
    const radius      = cardRadius(idx, total)
    const isLast      = idx === total - 1

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity - 1) }}
          style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >−</button>
        <span style={{ width: '16px', textAlign: 'center', fontSize: 'var(--text-sub)', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.quantity}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(gear.id, entry.quantity + 1) }}
          style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >+</button>
      </div>
    ) : null

    const weight = (
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '64px' }}>
        <span className="weight-mono" style={{ color: 'var(--text-secondary)', display: 'block' }}>
          {inPack && entry.quantity > 1 ? fmt(gear.weight_g * entry.quantity) : fmt(gear.weight_g)}
        </span>
        {inPack && entry.quantity > 1 && (
          <span className="weight-mono" style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', display: 'block', lineHeight: 1.2 }}>
            {fmt(gear.weight_g)}×{entry.quantity}
          </span>
        )}
      </div>
    )

    return (
      <div
        key={gear.id}
        className={`animate-fade-in ${isOpen ? '' : ''}`}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, touchAction: 'pan-y', zIndex: isOpen ? 20 : 'auto' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipe action buttons (mobile) */}
        <div
          className="sm:hidden"
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 20,
            display: 'flex', alignItems: 'stretch',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 200ms ease-out',
          }}
          onTouchStart={e => { e.stopPropagation(); touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={e => e.stopPropagation()}
        >
          <button
            onTouchEnd={(e) => { e.stopPropagation(); setEditingGear(gear); setSwipedId(null) }}
            style={{ width: '72px', background: '#3B6BC4', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', border: 'none', cursor: 'pointer' }}
          >
            <Pencil size={13} strokeWidth={2} />
            <span style={{ fontSize: 'var(--text-cat)', fontWeight: 500 }}>Edit</span>
          </button>
          <button
            onTouchEnd={(e) => { e.stopPropagation(); handleDelete(gear.id, gear.name) }}
            style={{ width: '72px', background: 'var(--color-destructive)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', border: 'none', cursor: 'pointer', borderRadius: isLast ? '0 0 var(--radius-card) 0' : '0' }}
          >
            <X size={13} strokeWidth={2} />
            <span style={{ fontSize: 'var(--text-cat)', fontWeight: 500 }}>Delete</span>
          </button>
        </div>

        {/* Card body */}
        <div
          style={{
            position: 'relative',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: radius,
            padding: '12px 16px',
            transform: isOpen ? 'translateX(-144px)' : 'translateX(0)',
            transition: 'transform 200ms ease-out, border-color var(--transition)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => { if (!inPack) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)' }}
          onMouseLeave={e => { if (!inPack) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)' }}
        >
          {/* Left accent bar (checked items) */}
          {inPack && (
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
              backgroundColor: accentColor,
              borderRadius: `${radius.split(' ')[0]} 0 0 ${radius.split(' ').slice(-1)[0]}`,
            }} />
          )}

          {/* Row 1: checkbox + name + weight + … */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: inPack ? '4px' : '0' }}>

            {/* Checkbox */}
            <button
              onClick={() => onTogglePack(gear)}
              aria-label={inPack ? 'Remove from pack' : 'Add to pack'}
              style={{
                width: '18px', height: '18px',
                borderRadius: '50%',
                border: inPack ? `2px solid ${accentColor}` : '2px solid var(--border-default)',
                background: inPack ? accentColor : 'transparent',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {inPack && (
                <svg className="animate-scale-in" width="9" height="9" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Gear name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 'var(--text-gear)', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                {gear.name}
              </p>
            </div>

            {/* Desktop stepper */}
            {inPack && <div className="hidden sm:flex">{stepper}</div>}

            {/* Weight */}
            {weight}

            {/* … mobile: slide toggle */}
            <button
              className="sm:hidden"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              aria-label="More options"
              onTouchEnd={(e) => { e.stopPropagation(); setSwipedId(isOpen ? null : gear.id) }}
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>

            {/* … desktop: hover-only */}
            <button
              className="hidden sm:flex"
              style={{ width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: 'transparent', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'color var(--transition), background var(--transition)' }}
              aria-label="More options"
              onClick={(e) => openDesktopMenu(e, gear.id)}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={e => { if (dropdownPos?.gearId !== gear.id) { e.currentTarget.style.color = 'transparent'; e.currentTarget.style.background = 'none' } }}
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Row 2 (mobile): brand · category + stepper */}
          <div className="sm:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingLeft: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
              {gear.brand && <span style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gear.brand}</span>}
              {gear.brand && <span style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)' }}>·</span>}
              <span style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{gear.category}</span>
            </div>
            {stepper}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Swipe overlay */}
      {swipedId && (
        <div
          className="sm:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          onTouchStart={() => setSwipedId(null)}
        />
      )}

      {/* Pack hint */}
      {showHint && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '8px 12px', marginBottom: '8px' }}>
          <span style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)' }}>○  Tap the circle to add gear to your pack</span>
          <button onClick={dismissHint} aria-label="Dismiss hint" style={{ marginLeft: '8px', flexShrink: 0, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      <div>
        {grouped.length === 1 ? (
          // Single group: no header
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {grouped[0].items.map((g, i) => renderGearCard(g, i, grouped[0].items.length))}
          </div>
        ) : (
          grouped.map(({ parent, items }) => {
            const isCollapsed  = collapsed.has(parent)
            const totalWeight  = items.reduce((s, g) => s + g.weight_g, 0)
            const checkedCount = items.filter(g => packItems.some(e => e.gear.id === g.id)).length
            const headerColor  = PARENT_COLOR[parent] ?? 'var(--text-tertiary)'

            return (
              <div key={parent} style={{ marginBottom: '4px' }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(parent)}
                  aria-expanded={!isCollapsed}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: headerColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-cat)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {parent}
                    </span>
                    <span style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', borderRadius: '999px', padding: '1px 6px' }}>
                      {items.length}
                    </span>
                    {checkedCount > 0 && (
                      <span style={{ fontSize: 'var(--text-cat)', color: 'var(--bg-primary)', background: 'var(--text-primary)', borderRadius: '999px', padding: '1px 6px' }}>
                        ✓ {checkedCount}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="weight-mono" style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)' }}>
                      {fmt(totalWeight)}
                    </span>
                    <ChevronDown
                      size={11} strokeWidth={2.5} aria-hidden
                      style={{ color: 'var(--text-tertiary)', transition: 'transform var(--transition)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                    />
                  </div>
                </button>

                {/* Cards */}
                <div style={{ overflow: 'hidden', transition: 'all 200ms ease-in-out', maxHeight: isCollapsed ? 0 : '9999px', opacity: isCollapsed ? 0 : 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '4px' }}>
                    {items.map((g, i) => renderGearCard(g, i, items.length))}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop popover — z-40 overlay + z-50 dropdown */}
      {dropdownPos && (
        <>
          <div
            className="hidden sm:block"
            style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-filter)' as string }}
            onClick={() => setDropdownPos(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 'var(--z-popover)' as string,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              padding: '2px 0',
              width: '120px',
            }}
          >
            <button
              onClick={() => {
                const gear = gears.find(g => g.id === dropdownPos.gearId)
                if (gear) setEditingGear(gear)
                setDropdownPos(null)
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: 'var(--text-weight)', color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Pencil size={12} strokeWidth={2} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              Edit
            </button>
            <button
              onClick={() => {
                const g = gears.find(g => g.id === dropdownPos.gearId)
                handleDelete(dropdownPos.gearId, g?.name ?? '')
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: 'var(--text-weight)', color: 'var(--color-destructive)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,72,77,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <X size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
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

      {/* Delete Undo snackbar */}
      {pendingDelete && (
        <div
          className="animate-fade-slide-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 'var(--z-snackbar)' as string,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-weight)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            &ldquo;{pendingDelete.name}&rdquo; deleted
          </span>
          <button
            onClick={handleUndoDelete}
            style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: '2px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'opacity var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
