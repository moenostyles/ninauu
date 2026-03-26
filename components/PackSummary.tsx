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
  if (v === 'public') return 'followers'
  if (v === 'followers') return 'private'
  return 'public'
}

function VisibilityLabel({ v }: { v: Visibility }) {
  if (v === 'public')    return <><Globe size={10} strokeWidth={2} /> Public</>
  if (v === 'followers') return <><Users size={10} strokeWidth={2} /> Followers</>
  return <><Lock size={10} strokeWidth={2} /> Private</>
}

// ── カテゴリカラー (GearList の左ボーダーと共通) ─────────────────────
const DONUT_COLORS = BIG3_COLORS

// ── SVG ドーナツチャート ─────────────────────────────────────────────
function DonutChart({
  shelter, pack, sleep, others,
}: { shelter: number; pack: number; sleep: number; others: number }) {
  const total = shelter + pack + sleep + others
  if (total === 0) return null

  const cx = 40, cy = 40, r = 30, sw = 12
  const C = 2 * Math.PI * r   // ≈ 188.5

  const segs = [
    { v: shelter, c: DONUT_COLORS.shelter },
    { v: pack,    c: DONUT_COLORS.pack    },
    { v: sleep,   c: DONUT_COLORS.sleep   },
    { v: others,  c: DONUT_COLORS.others  },
  ]

  let offset = 0
  return (
    <svg
      width="64" height="64"
      viewBox="0 0 80 80"
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
      aria-hidden
    >
      {/* トラック */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={sw} />
      {/* セグメント */}
      {segs.map(({ v, c }, i) => {
        if (v <= 0) return null
        const arc = (v / total) * C
        const node = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeDasharray={`${arc} ${C - arc}`}
            strokeDashoffset={-offset}
          />
        )
        offset += arc
        return node
      })}
    </svg>
  )
}

export default function PackSummary({
  items, savedPacks, onRemove, onClearAll, onSave, onLoad, onDeleteSaved, onToggleVisibility,
}: Props) {
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

  const itemCount = items.reduce((s, e) => s + e.quantity, 0)
  const isEmpty   = items.length === 0

  const handleSave = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    await onSave(saveName.trim(), saveVisibility)
    setSaving(false)
    setSaveName('')
    setSaveVisibility('private')
    setShowSaveInput(false)
  }

  return (
    <div className="mb-4 space-y-2">

      {/* ── TOTAL WEIGHT バー ─────────────────────────────────── */}
      <div className="bg-ink text-surface rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* ドーナツチャート（アイテムありの時のみ） */}
          {!isEmpty && (
            <DonutChart
              shelter={shelterWeight}
              pack={backpackWeight}
              sleep={sleepWeight}
              others={othersWeight}
            />
          )}

          {/* 左：合計重量 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-ink-3 uppercase tracking-widest">Total Weight</p>
              {!isEmpty && (
                <button onClick={onClearAll} className="text-[10px] text-ink-3 hover:text-surface transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <p className="text-2xl font-bold mt-0.5 nums leading-none">{fmtWeight(totalWeight)}</p>
            <p className="text-[10px] text-ink-3 mt-0.5">
              {isEmpty
                ? <span className="opacity-60">Check items to build your pack</span>
                : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
              }
            </p>
          </div>

          {/* 右：カテゴリ内訳（アイテムありの時のみ） */}
          {!isEmpty && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-l border-ink-2 pl-3 shrink-0">
              {[
                { label: 'Shelter', w: shelterWeight, c: DONUT_COLORS.shelter },
                { label: 'Pack',    w: backpackWeight, c: DONUT_COLORS.pack    },
                { label: 'Sleep',   w: sleepWeight,    c: DONUT_COLORS.sleep   },
                { label: 'Big 3',   w: big3Weight,     c: '#F9FAFB', bold: true },
              ].map(({ label, w, c, bold }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: c, opacity: bold ? 1 : 0.8 }}>
                    {label}
                  </p>
                  <p className={`text-xs nums ${bold ? 'font-bold' : 'font-medium'}`}>
                    {w > 0 ? fmtWeight(w) : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 水平スタックバー（アイテムありの時） ── */}
        {!isEmpty && totalWeight > 0 && (
          <div className="flex h-1" aria-hidden>
            {shelterWeight  > 0 && <div style={{ flex: shelterWeight,  background: DONUT_COLORS.shelter }} />}
            {backpackWeight > 0 && <div style={{ flex: backpackWeight, background: DONUT_COLORS.pack    }} />}
            {sleepWeight    > 0 && <div style={{ flex: sleepWeight,    background: DONUT_COLORS.sleep   }} />}
            {othersWeight   > 0 && <div style={{ flex: othersWeight,   background: DONUT_COLORS.others  }} />}
          </div>
        )}
      </div>

      {/* ── ツールバー ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowSavedPacks(p => !p)}
          className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center gap-1"
        >
          <ChevronDown size={13} strokeWidth={2} className={`transition-transform duration-150 ${showSavedPacks ? 'rotate-180' : ''}`} />
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

      {/* ── Saved packs パネル ────────────────────────────────── */}
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

      {/* ── Save input ───────────────────────────────────────── */}
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
