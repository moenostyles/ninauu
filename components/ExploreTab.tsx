'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Globe, Users, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface Props {
  currentUserId: string
}

interface ExploreItem {
  id: string
  name: string
  user_id: string
  visibility: string
  created_at: string
  display_name: string | null
  avatar_url: string | null
  type: 'pack' | 'trip'
  // pack-specific
  item_count?: number
  total_weight?: number
  // trip-specific
  destination?: string
  start_date?: string
  end_date?: string
  total_weight_g?: number
  rating?: number
}

function fmtWeight(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = e.getFullYear()
  if (s.getFullYear() === e.getFullYear()) return `${fmt(s)} – ${fmt(e)}, ${year}`
  return `${fmt(s)}, ${s.getFullYear()} – ${fmt(e)}, ${year}`
}

function Avatar({ displayName, avatarUrl, size = 7 }: { displayName: string | null; avatarUrl: string | null; size?: number }) {
  const initial = displayName?.charAt(0)?.toUpperCase() ?? '?'
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-fill-2 flex items-center justify-center shrink-0`
  return (
    <div className={cls}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-ink-2">{initial}</span>
      )}
    </div>
  )
}

export default function ExploreTab({ currentUserId }: Props) {
  const [packs, setPacks] = useState<ExploreItem[]>([])
  const [trips, setTrips] = useState<ExploreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'following'>('all')
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null)
  const [packItems, setPackItems] = useState<Record<string, { gear_name: string; brand: string; weight_g: number; category: string; quantity: number }[]>>({})

  useEffect(() => {
    loadExplore()
  }, [filter])

  const loadExplore = async () => {
    setLoading(true)

    // Load following IDs if filter === 'following'
    let followingIds: string[] = []
    if (filter === 'following') {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
      followingIds = (data ?? []).map((r: { following_id: string }) => r.following_id)
      if (followingIds.length === 0) {
        setPacks([])
        setTrips([])
        setLoading(false)
        return
      }
    }

    // Fetch public/followers packs (excluding own)
    let packsQuery = supabase
      .from('saved_packs')
      .select('id, name, user_id, visibility, created_at')
      .neq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'following') {
      packsQuery = packsQuery.in('user_id', followingIds)
    } else {
      packsQuery = packsQuery.eq('visibility', 'public')
    }

    const { data: packsData } = await packsQuery

    // Fetch public/followers trips (excluding own)
    let tripsQuery = supabase
      .from('trips')
      .select('id, destination, start_date, end_date, total_weight_g, rating, user_id, visibility, created_at')
      .neq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'following') {
      tripsQuery = tripsQuery.in('user_id', followingIds)
    } else {
      tripsQuery = tripsQuery.eq('visibility', 'public')
    }

    const { data: tripsData } = await tripsQuery

    // Fetch profiles for all user_ids
    const allUserIds = [
      ...new Set([
        ...(packsData ?? []).map((p: { user_id: string }) => p.user_id),
        ...(tripsData ?? []).map((t: { user_id: string }) => t.user_id),
      ]),
    ]

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', allUserIds)
      for (const p of profiles ?? []) {
        profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      }
    }

    // Fetch pack item counts
    const packIds = (packsData ?? []).map((p: { id: string }) => p.id)
    const countMap: Record<string, { count: number; weight: number }> = {}
    if (packIds.length > 0) {
      const { data: itemsData } = await supabase
        .from('saved_pack_items')
        .select('pack_id, weight_g, quantity')
        .in('pack_id', packIds)
      for (const item of itemsData ?? []) {
        if (!countMap[item.pack_id]) countMap[item.pack_id] = { count: 0, weight: 0 }
        countMap[item.pack_id].count += item.quantity
        countMap[item.pack_id].weight += item.weight_g * item.quantity
      }
    }

    const enrichedPacks: ExploreItem[] = (packsData ?? []).map((p: { id: string; name: string; user_id: string; visibility: string; created_at: string }) => ({
      ...p,
      type: 'pack' as const,
      display_name: profileMap[p.user_id]?.display_name ?? null,
      avatar_url: profileMap[p.user_id]?.avatar_url ?? null,
      item_count: countMap[p.id]?.count ?? 0,
      total_weight: countMap[p.id]?.weight ?? 0,
    }))

    const enrichedTrips: ExploreItem[] = (tripsData ?? []).map((t: { id: string; destination: string; start_date: string; end_date: string; total_weight_g: number; rating: number; user_id: string; visibility: string; created_at: string }) => ({
      ...t,
      name: t.destination,
      type: 'trip' as const,
      display_name: profileMap[t.user_id]?.display_name ?? null,
      avatar_url: profileMap[t.user_id]?.avatar_url ?? null,
    }))

    setPacks(enrichedPacks)
    setTrips(enrichedTrips)
    setLoading(false)
  }

  const loadPackItems = async (packId: string) => {
    if (packItems[packId]) return
    const { data } = await supabase
      .from('saved_pack_items')
      .select('gear_name, brand, weight_g, category, quantity')
      .eq('pack_id', packId)
    if (data) setPackItems((prev) => ({ ...prev, [packId]: data }))
  }

  const handleExpandPack = (packId: string) => {
    if (expandedPackId === packId) {
      setExpandedPackId(null)
    } else {
      setExpandedPackId(packId)
      loadPackItems(packId)
    }
  }

  if (loading) {
    return <p className="text-ink-3 text-sm py-12 text-center">Loading…</p>
  }

  const allItems = [...packs, ...trips].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === 'all' ? 'bg-ink text-surface border-ink' : 'bg-surface text-ink-3 border-line hover:bg-fill'
          }`}
        >
          <Globe size={12} strokeWidth={2} /> Public
        </button>
        <button
          onClick={() => setFilter('following')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === 'following' ? 'bg-ink text-surface border-ink' : 'bg-surface text-ink-3 border-line hover:bg-fill'
          }`}
        >
          <Users size={12} strokeWidth={2} /> Following
        </button>
      </div>

      {allItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-3 text-sm">
            {filter === 'following' ? 'フォロー中のユーザーの投稿はありません。' : 'まだ公開コンテンツがありません。'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
              {item.type === 'pack' ? (
                <div>
                  <div
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-fill transition-colors"
                    onClick={() => handleExpandPack(item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 font-medium">Pack</span>
                        <span className="font-semibold text-sm text-ink truncate">{item.name}</span>
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-ink-3">
                        {(item.item_count ?? 0) > 0 && <span>{item.item_count} items</span>}
                        {(item.total_weight ?? 0) > 0 && <span className="font-medium text-ink-2">{fmtWeight(item.total_weight ?? 0)}</span>}
                      </div>
                    </div>
                    <Link
                      href={`/profile/${item.user_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 shrink-0 hover:opacity-70 transition-opacity"
                    >
                      <Avatar displayName={item.display_name} avatarUrl={item.avatar_url} size={6} />
                      <span className="text-xs text-ink-3 hidden sm:block">{item.display_name ?? 'Anonymous'}</span>
                    </Link>
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className={`text-ink-3 transition-transform duration-200 ${expandedPackId === item.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {expandedPackId === item.id && packItems[item.id] && (
                    <div className="border-t border-line px-4 py-3 bg-fill space-y-1.5">
                      {packItems[item.id].map((gi, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 shrink-0">{gi.category}</span>
                          <span className="text-xs text-ink-2 flex-1 truncate">
                            {gi.gear_name}
                            {gi.brand && <span className="text-ink-3"> · {gi.brand}</span>}
                            {gi.quantity > 1 && <span className="text-ink-3"> ×{gi.quantity}</span>}
                          </span>
                          <span className="text-xs text-ink-3 shrink-0">{gi.weight_g * gi.quantity}g</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 font-medium">Trip</span>
                      <span className="font-semibold text-sm text-ink truncate">{item.destination}</span>
                      {(item.rating ?? 0) > 0 && (
                        <span className="text-xs text-ink">{'★'.repeat(item.rating ?? 0)}</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-ink-3">
                      {item.start_date && item.end_date && (
                        <span>{formatDateRange(item.start_date, item.end_date)}</span>
                      )}
                      {(item.total_weight_g ?? 0) > 0 && (
                        <span className="font-medium text-ink-2">{fmtWeight(item.total_weight_g ?? 0)}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/profile/${item.user_id}`}
                    className="flex items-center gap-1.5 shrink-0 hover:opacity-70 transition-opacity"
                  >
                    <Avatar displayName={item.display_name} avatarUrl={item.avatar_url} size={6} />
                    <span className="text-xs text-ink-3 hidden sm:block">{item.display_name ?? 'Anonymous'}</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
