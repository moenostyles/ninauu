'use client'

import { useState } from 'react'
import { ChevronDown, Globe, Lock, Users, X } from 'lucide-react'
import { PackEntry, SavedPack, Visibility } from '@/types'
import { useWeightUnit } from '@/lib/weight-unit-context'
import { BIG3_COLORS } from '@/lib/category-colors'

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

function nextVisibility(v: Visibility): Visibility {
  if (v === 'public')    return 'followers'
  if (v === 'followers') return 'private'
  return 'public'
}

function VisibilityLabel({ v }: { v: Visibility }) {
  if (v === 'public')    return <><Globe size={10} strokeWidth={2} /> Public</>
  if (v === 'followers') return <><Users size={10} strokeWidth={2} /> Followers</>
  return <><Lock size={10} strokeWidth={2} /> Private</>
}

const DONUT_COLORS = BIG3_COLORS

function DonutChart({ shelter, pack, sleep, others }: { shelter: number; pack: number; sleep: number; others: number }) {
  const total = shelter + pack + sleep + others
  if (total === 0) return null
  const cx = 40, cy = 40, r = 30, sw = 12
  const C = 2 * Math.PI * r

  const segs = [
    { v: shelter, c: DONUT_COLORS.shelter },
    { v: pack,    c: DONUT_COLORS.pack    },
    { v: sleep,   c: DONUT_COLORS.sleep   },
    { v: others,  c: DONUT_COLORS.others  },
  ]

  let offset = 0
  return (
    <svg width="56" height="56" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={sw} />
      {segs.map(({ v, c }, i) => {
        if (v <= 0) return null
        const arc = (v / total) * C
        const node = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={sw}
            strokeDasharray={`${arc} ${C - arc}`} strokeDashoffset={-offset} />
        )
        offset += arc
        return node
      })}
    </svg>
  )
}

export default function PackSummary({ items, savedPacks, onRemove, onClearAll, onSave, onLoad, onDeleteSaved, onToggleVisibility }: Props) {
  const { fmt: fmtWeight } = useWeightUnit()
  const [showSaveInput,  setShowSaveInput]  = useState(false)
  const [saveName,       setSaveName]       = useState('')
  const [saveVisibility, setSaveVisibility] = useState<Visibility>('private')
  const [saving,         setSaving]         = useState(false)
  const [showSavedPacks, setShowSavedPacks] = useState(false)

  const totalWeight    = items.reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const shelterWeight  = items.filter(e => e.gear.category === 'Tent' || e.gear.category === 'Tarp')
                              .reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const backpackWeight = items.filter(e => e.gear.category === 'Backpack')
                              .reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const sleepWeight    = items.filter(e => e.gear.category === 'Sleeping Bag' || e.gear.category === 'Sleeping Mat')
                              .reduce((s, e) => s + e.gear.weight_g * e.quantity, 0)
  const big3Weight     = shelterWeight + backpackWeight + sleepWeight
  const othersWeight   = Math.max(0, totalWeight - big3Weight)
  const itemCount      = items.reduce((s, e) => s + e.quantity, 0)
  const isEmpty        = items.length === 0

  const handleSave = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    await onSave(saveName.trim(), saveVisibility)
    setSaving(false)
    setSaveName(''); setSaveVisibility('private'); setShowSaveInput(false)
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    height: '36px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-card)',
    padding: '0 12px',
    fontSize: 'var(--text-weight)',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* ── TOTAL WEIGHT bar ── */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-panel)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Donut (when items) */}
          {!isEmpty && (
            <DonutChart shelter={shelterWeight} pack={backpackWeight} sleep={sleepWeight} others={othersWeight} />
          )}

          {/* Total weight */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Weight
              </p>
              {!isEmpty && (
                <button
                  onClick={onClearAll}
                  style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--transition)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="weight-mono" style={{ fontSize: '22px', fontWeight: 600, marginTop: '2px', lineHeight: 1, color: 'var(--text-primary)' }}>
              {fmtWeight(totalWeight)}
            </p>
            <p style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {isEmpty
                ? <span style={{ opacity: 0.6 }}>Check items to build your pack</span>
                : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
              }
            </p>
          </div>

          {/* Category breakdown (when items) */}
          {!isEmpty && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px', flexShrink: 0 }}>
              {[
                { label: 'Shelter', w: shelterWeight, c: DONUT_COLORS.shelter },
                { label: 'Pack',    w: backpackWeight, c: DONUT_COLORS.pack    },
                { label: 'Sleep',   w: sleepWeight,    c: DONUT_COLORS.sleep   },
                { label: 'Big 3',   w: big3Weight,     c: 'var(--text-primary)', bold: true },
              ].map(({ label, w, c, bold }) => (
                <div key={label}>
                  <p style={{ fontSize: 'var(--text-cat)', textTransform: 'uppercase', letterSpacing: '0.04em', color: c, opacity: bold ? 1 : 0.8, lineHeight: 1.2 }}>
                    {label}
                  </p>
                  <p className="weight-mono" style={{ fontSize: 'var(--text-sub)', fontWeight: bold ? 600 : 400, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {w > 0 ? fmtWeight(w) : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stack bar */}
        {!isEmpty && totalWeight > 0 && (
          <div style={{ display: 'flex', height: '3px' }} aria-hidden>
            {shelterWeight  > 0 && <div style={{ flex: shelterWeight,  background: DONUT_COLORS.shelter }} />}
            {backpackWeight > 0 && <div style={{ flex: backpackWeight, background: DONUT_COLORS.pack    }} />}
            {sleepWeight    > 0 && <div style={{ flex: sleepWeight,    background: DONUT_COLORS.sleep   }} />}
            {othersWeight   > 0 && <div style={{ flex: othersWeight,   background: DONUT_COLORS.others  }} />}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setShowSavedPacks(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--transition)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <ChevronDown size={13} strokeWidth={2} style={{ transition: `transform var(--transition)`, transform: showSavedPacks ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          Saved packs{savedPacks.length > 0 ? ` (${savedPacks.length})` : ''}
        </button>
        {!isEmpty && (
          <button
            onClick={() => setShowSaveInput(p => !p)}
            style={{ fontSize: 'var(--text-sub)', padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', transition: 'border-color var(--transition), color var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {showSaveInput ? 'Cancel' : 'Save pack'}
          </button>
        )}
      </div>

      {/* ── Saved packs panel ── */}
      {showSavedPacks && (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-panel)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {savedPacks.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>No saved packs yet.</p>
          ) : savedPacks.map(pack => (
            <div key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-card)', padding: '8px 12px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontSize: 'var(--text-weight)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pack.name}</span>
              <button
                onClick={() => onToggleVisibility(pack.id, nextVisibility(pack.visibility ?? 'private'))}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-cat)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', background: 'transparent', cursor: 'pointer', transition: 'border-color var(--transition)', whiteSpace: 'nowrap' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                <VisibilityLabel v={pack.visibility ?? 'private'} />
              </button>
              <button
                onClick={() => { onLoad(pack.id); setShowSavedPacks(false) }}
                style={{ fontSize: 'var(--text-sub)', padding: '4px 10px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                Load
              </button>
              <button
                onClick={() => { if (confirm(`Delete "${pack.name}"?`)) onDeleteSaved(pack.id) }}
                style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, transition: 'color var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-destructive)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Save input ── */}
      {showSaveInput && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Pack name"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
          <button
            type="button"
            onClick={() => setSaveVisibility(p => nextVisibility(p))}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            <VisibilityLabel v={saveVisibility} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            style={{ padding: '0 16px', background: 'var(--color-accent)', color: 'var(--bg-primary)', fontSize: 'var(--text-weight)', fontWeight: 500, border: 'none', borderRadius: 'var(--radius-card)', cursor: saving || !saveName.trim() ? 'default' : 'pointer', opacity: saving || !saveName.trim() ? 0.4 : 1, transition: 'opacity var(--transition)', whiteSpace: 'nowrap' }}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
