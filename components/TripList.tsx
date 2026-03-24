'use client'

import { useState } from 'react'
import { X, ChevronDown, Pencil, Globe, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Trip, TripItem } from '@/types'
import EditTripModal from '@/components/EditTripModal'

interface Props {
  trips: Trip[]
  onRefresh: () => void
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = e.getFullYear()
  if (s.getFullYear() === e.getFullYear()) {
    return `${fmt(s)} – ${fmt(e)}, ${year}`
  }
  return `${fmt(s)}, ${s.getFullYear()} – ${fmt(e)}, ${year}`
}

function fmtWeight(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
}

function Stars({ rating }: { rating: number }) {
  if (rating === 0) return null
  return (
    <span className="text-ink text-sm tracking-tight">
      {'★'.repeat(rating)}
      <span className="text-fill-2">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}


export default function TripList({ trips, onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [itemsCache, setItemsCache] = useState<Record<string, TripItem[]>>({})
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  const loadItems = async (tripId: string) => {
    if (itemsCache[tripId]) return
    const { data } = await supabase
      .from('trip_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at')
    if (data) setItemsCache((prev) => ({ ...prev, [tripId]: data as TripItem[] }))
  }

  const handleExpand = (tripId: string) => {
    if (expandedId === tripId) {
      setExpandedId(null)
    } else {
      setExpandedId(tripId)
      loadItems(tripId)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this trip?')) return
    await supabase.from('trips').delete().eq('id', id)
    onRefresh()
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-3 text-sm">No trips recorded yet.</p>
        <p className="text-ink-3 text-xs mt-1">Save your first adventure!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trips.map((trip) => {
        const isExpanded = expandedId === trip.id
        const items = itemsCache[trip.id] ?? []

        return (
          <div
            key={trip.id}
            className="bg-white border border-line rounded-xl shadow-sm overflow-hidden"
          >
            {/* Summary row */}
            <div
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-fill transition-colors"
              onClick={() => handleExpand(trip.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink">{trip.destination}</span>
                  <Stars rating={trip.rating} />
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-ink-3 flex-wrap">
                  <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                  {trip.total_weight_g > 0 && (
                    <span className="font-medium text-ink-2">{fmtWeight(trip.total_weight_g)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    const newVis = trip.visibility === 'public' ? 'private' : 'public'
                    await supabase.from('trips').update({ visibility: newVis }).eq('id', trip.id)
                    onRefresh()
                  }}
                  className="text-xs px-2 py-0.5 rounded-full border border-line text-ink-3 hover:border-ink hover:text-ink transition-colors shrink-0 flex items-center gap-1"
                  title="Toggle visibility"
                >
                  {trip.visibility === 'public' ? (
                    <><Globe size={11} strokeWidth={2} /> Public</>
                  ) : (
                    <><Lock size={11} strokeWidth={2} /> Private</>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingTrip(trip) }}
                  className="text-line hover:text-ink transition-colors p-0.5"
                  title="Edit"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, trip.id)}
                  className="text-line hover:text-red-400 transition-colors p-0.5"
                  title="Delete"
                >
                  <X size={16} strokeWidth={2} />
                </button>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`text-ink-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Detail panel */}
            {isExpanded && (
              <div className="border-t border-line px-4 py-4 bg-fill space-y-4">
                {items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                      Gear · {items.length} items
                    </p>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-fill-2 text-ink-3">
                            {item.category}
                          </span>
                          <span className="text-xs text-ink-2 flex-1 truncate">
                            {item.gear_name}
                            {item.brand && (
                              <span className="text-ink-3"> · {item.brand}</span>
                            )}
                          </span>
                          <span className="text-xs text-ink-3 shrink-0">{item.weight_g}g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trip.memo && (
                  <div>
                    <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs text-ink-2 whitespace-pre-wrap leading-relaxed">{trip.memo}</p>
                  </div>
                )}

                {items.length === 0 && !trip.memo && (
                  <p className="text-xs text-ink-3">No details recorded.</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={() => { onRefresh(); setEditingTrip(null) }}
        />
      )}
    </div>
  )
}
