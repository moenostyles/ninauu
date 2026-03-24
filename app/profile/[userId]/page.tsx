'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Profile, Trip, SavedPack, TripItem } from '@/types'
import { Globe, Users, Lock, ChevronDown, Pencil, Check, X, ArrowLeft, Camera } from 'lucide-react'

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

function VisibilityIcon({ v }: { v?: string }) {
  if (v === 'public') return <Globe size={11} strokeWidth={2} className="text-ink-3" />
  if (v === 'followers') return <Users size={11} strokeWidth={2} className="text-ink-3" />
  return <Lock size={11} strokeWidth={2} className="text-ink-3" />
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const isOwn = user?.id === userId

  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [packs, setPacks] = useState<SavedPack[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Expanded trip/pack state
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [tripItemsCache, setTripItemsCache] = useState<Record<string, TripItem[]>>({})
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null)
  const [packItemsCache, setPackItemsCache] = useState<Record<string, { gear_name: string; brand: string; weight_g: number; category: string; quantity: number }[]>>({})

  const loadProfile = useCallback(async () => {
    const [profileRes, tripsRes, packsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('trips').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      supabase.from('saved_packs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (tripsRes.data) setTrips(tripsRes.data as Trip[])
    if (packsRes.data) setPacks(packsRes.data as SavedPack[])
    setFollowerCount(followersRes.count ?? 0)
    setFollowingCount(followingRes.count ?? 0)

    if (user && !isOwn) {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle()
      setIsFollowing(!!data)
    }

    setLoading(false)
  }, [userId, user, isOwn])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleFollow = async () => {
    if (!user) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId)
      setIsFollowing(false)
      setFollowerCount((c) => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
      setIsFollowing(true)
      setFollowerCount((c) => c + 1)
    }
    setFollowLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    await supabase.from('profiles').update({
      display_name: editDisplayName.trim() || null,
      username: editUsername.trim() || null,
    }).eq('id', user.id)
    setProfile((p) => p ? { ...p, display_name: editDisplayName.trim() || null, username: editUsername.trim() || null } : p)
    setEditingProfile(false)
    setSavingProfile(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)

    const ext = file.name.split('.').pop()
    const path = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
    } else {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      // Cache-busting URL
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now()
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
      if (updateError) {
        alert('Profile update failed: ' + updateError.message)
      } else {
        setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p)
      }
    }

    setUploadingAvatar(false)
    e.target.value = ''
  }

  const loadTripItems = async (tripId: string) => {
    if (tripItemsCache[tripId]) return
    const { data } = await supabase.from('trip_items').select('*').eq('trip_id', tripId).order('created_at')
    if (data) setTripItemsCache((prev) => ({ ...prev, [tripId]: data as TripItem[] }))
  }

  const loadPackItems = async (packId: string) => {
    if (packItemsCache[packId]) return
    const { data } = await supabase.from('saved_pack_items').select('gear_name, brand, weight_g, category, quantity').eq('pack_id', packId)
    if (data) setPackItemsCache((prev) => ({ ...prev, [packId]: data }))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><p className="text-ink-3 text-sm">Loading…</p></div>
  }

  if (!profile) {
    return <div className="flex items-center justify-center py-32"><p className="text-ink-3 text-sm">User not found.</p></div>
  }

  const initial = profile.display_name?.charAt(0)?.toUpperCase() ?? profile.username?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={2} /> Back
      </button>

      {/* Profile header */}
      <div className="bg-white border border-line rounded-2xl px-5 py-5">
        <div className="flex items-start gap-4">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-fill-2 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-ink-2">{initial}</span>
              )}
            </div>
            {isOwn && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ink text-surface flex items-center justify-center hover:bg-ink-2 transition-colors disabled:opacity-40"
                  title="Change photo"
                >
                  {uploadingAvatar ? (
                    <span className="text-[8px]">…</span>
                  ) : (
                    <Camera size={11} strokeWidth={2} />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Name / edit */}
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Display name"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                />
                <input
                  type="text"
                  placeholder="Username (optional)"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink text-surface text-xs rounded-lg disabled:opacity-40"
                  >
                    <Check size={12} strokeWidth={2.5} /> Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-line text-ink-3 text-xs rounded-lg"
                  >
                    <X size={12} strokeWidth={2.5} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{profile.display_name ?? profile.username ?? 'Anonymous'}</p>
                  {profile.username && <p className="text-xs text-ink-3">@{profile.username}</p>}
                  {isOwn && (
                    <button
                      onClick={() => {
                        setEditDisplayName(profile.display_name ?? '')
                        setEditUsername(profile.username ?? '')
                        setEditingProfile(true)
                      }}
                      className="text-line hover:text-ink transition-colors p-0.5"
                    >
                      <Pencil size={12} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-ink-3">
                  <span><strong className="text-ink">{followerCount}</strong> followers</span>
                  <span><strong className="text-ink">{followingCount}</strong> following</span>
                </div>
              </>
            )}
          </div>

          {!isOwn && user && !editingProfile && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`shrink-0 px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 ${
                isFollowing
                  ? 'border border-line text-ink-3 hover:bg-fill'
                  : 'bg-ink text-surface hover:bg-ink-2'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Trips */}
      {trips.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Trips</h2>
          <div className="space-y-2">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-fill transition-colors"
                  onClick={() => {
                    if (expandedTripId === trip.id) { setExpandedTripId(null) }
                    else { setExpandedTripId(trip.id); loadTripItems(trip.id) }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">{trip.destination}</span>
                      {(trip.rating ?? 0) > 0 && <span className="text-xs">{'★'.repeat(trip.rating ?? 0)}</span>}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-ink-3">
                      <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                      {(trip.total_weight_g ?? 0) > 0 && <span className="font-medium text-ink-2">{fmtWeight(trip.total_weight_g ?? 0)}</span>}
                    </div>
                  </div>
                  <VisibilityIcon v={trip.visibility} />
                  <ChevronDown size={14} strokeWidth={2} className={`text-ink-3 transition-transform duration-200 ${expandedTripId === trip.id ? 'rotate-180' : ''}`} />
                </div>
                {expandedTripId === trip.id && (
                  <div className="border-t border-line px-4 py-3 bg-fill space-y-1.5">
                    {(tripItemsCache[trip.id] ?? []).map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 shrink-0">{item.category}</span>
                        <span className="text-xs text-ink-2 flex-1 truncate">
                          {item.gear_name}
                          {item.brand && <span className="text-ink-3"> · {item.brand}</span>}
                        </span>
                        <span className="text-xs text-ink-3 shrink-0">{item.weight_g}g</span>
                      </div>
                    ))}
                    {trip.memo && (
                      <p className="text-xs text-ink-2 whitespace-pre-wrap leading-relaxed pt-1 border-t border-line">{trip.memo}</p>
                    )}
                    {(tripItemsCache[trip.id] ?? []).length === 0 && !trip.memo && (
                      <p className="text-xs text-ink-3">No details recorded.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packs */}
      {packs.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Saved Packs</h2>
          <div className="space-y-2">
            {packs.map((pack) => (
              <div key={pack.id} className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-fill transition-colors"
                  onClick={() => {
                    if (expandedPackId === pack.id) { setExpandedPackId(null) }
                    else { setExpandedPackId(pack.id); loadPackItems(pack.id) }
                  }}
                >
                  <span className="font-semibold text-sm text-ink flex-1 truncate">{pack.name}</span>
                  <VisibilityIcon v={pack.visibility} />
                  <ChevronDown size={14} strokeWidth={2} className={`text-ink-3 transition-transform duration-200 ${expandedPackId === pack.id ? 'rotate-180' : ''}`} />
                </div>
                {expandedPackId === pack.id && (
                  <div className="border-t border-line px-4 py-3 bg-fill space-y-1.5">
                    {(packItemsCache[pack.id] ?? []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 shrink-0">{item.category}</span>
                        <span className="text-xs text-ink-2 flex-1 truncate">
                          {item.gear_name}
                          {item.brand && <span className="text-ink-3"> · {item.brand}</span>}
                          {item.quantity > 1 && <span className="text-ink-3"> ×{item.quantity}</span>}
                        </span>
                        <span className="text-xs text-ink-3 shrink-0">{item.weight_g * item.quantity}g</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && packs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-3 text-sm">No public content yet.</p>
        </div>
      )}
    </div>
  )
}
