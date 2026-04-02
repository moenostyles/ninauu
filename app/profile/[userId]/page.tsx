'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Profile, Trip, SavedPack, TripItem } from '@/types'
import { Globe, Users, Lock, ChevronDown, Pencil, Check, X, ArrowLeft, Camera, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

interface FollowUser {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

function FollowListModal({
  title,
  userIds,
  mutualIds,
  onClose,
}: {
  title: string
  userIds: string[]
  mutualIds: Set<string>
  onClose: () => void
}) {
  const [users, setUsers] = useState<FollowUser[]>([])

  useEffect(() => {
    if (userIds.length === 0) { setUsers([]); return }
    supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds)
      .then(({ data }) => setUsers((data ?? []) as FollowUser[]))
  }, [userIds.join(',')])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="font-semibold text-sm text-ink">{title}</p>
          <button onClick={onClose} className="text-ink-3 hover:text-ink"><X size={16} strokeWidth={2} /></button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-xs text-ink-3 text-center py-8">No users yet.</p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-fill transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-fill-2 flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-ink-2">
                      {(u.display_name ?? u.username ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{u.display_name ?? u.username ?? 'Anonymous'}</p>
                  {u.username && <p className="text-xs text-ink-3">@{u.username}</p>}
                </div>
                {mutualIds.has(u.id) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-fill-2 text-ink-3 shrink-0">Mutual</span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
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
  const [followerIds, setFollowerIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [isBlocked, setIsBlocked] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set())

  const [editingProfile, setEditingProfile] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [tripItemsCache, setTripItemsCache] = useState<Record<string, TripItem[]>>({})
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null)
  const [packItemsCache, setPackItemsCache] = useState<Record<string, { gear_name: string; brand: string; weight_g: number; category: string; quantity: number }[]>>({})

  const loadProfile = useCallback(async () => {
    const [profileRes, tripsRes, packsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('trips').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      supabase.from('saved_packs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('follows').select('follower_id').eq('following_id', userId),
      supabase.from('follows').select('following_id').eq('follower_id', userId),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (tripsRes.data) setTrips(tripsRes.data as Trip[])
    if (packsRes.data) setPacks(packsRes.data as SavedPack[])

    const fwrIds = (followersRes.data ?? []).map((r: { follower_id: string }) => r.follower_id)
    const fwgIds = (followingRes.data ?? []).map((r: { following_id: string }) => r.following_id)
    setFollowerIds(fwrIds)
    setFollowingIds(fwgIds)
    setFollowerCount(fwrIds.length)
    setFollowingCount(fwgIds.length)

    if (user && !isOwn) {
      const [followCheck, blockCheck, myFollowingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle(),
        supabase
          .from('blocks')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', userId)
          .maybeSingle(),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id),
      ])
      setIsFollowing(!!followCheck.data)
      setIsBlocked(!!blockCheck.data)
      setMyFollowingIds(new Set((myFollowingRes.data ?? []).map((r: { following_id: string }) => r.following_id)))
    }

    setLoading(false)
  }, [userId, user, isOwn])

  useEffect(() => { loadProfile() }, [loadProfile])

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

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

  const handleBlock = async () => {
    if (!user) return
    setBlockLoading(true)
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', userId)
      setIsBlocked(false)
    } else {
      await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: userId })
      setIsBlocked(true)
    }
    setBlockLoading(false)
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

  const followerMutualIds = new Set(followerIds.filter((id) => myFollowingIds.has(id)))
  const followingMutualIds = new Set(followingIds.filter((id) => followerIds.includes(id)))

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={2} /> Back
      </button>

      <div className="bg-white border border-line rounded-2xl px-5 py-5 space-y-4">

        {/* ── アバター + テキスト情報 ── */}
        <div className="flex items-center gap-4">

          {/* アバター */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-fill-2 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-ink-2">{initial}</span>
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
                  {uploadingAvatar ? <span className="text-[8px]">…</span> : <Camera size={11} strokeWidth={2} />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* 名前 + stats */}
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
                    className="flex-1 py-1.5 bg-ink text-surface text-xs font-medium rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-40"
                  >
                    {savingProfile ? '…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="flex-1 py-1.5 border border-line text-ink-3 text-xs font-medium rounded-lg hover:bg-fill transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-ink">{profile.display_name ?? profile.username ?? 'Anonymous'}</p>
                  {isOwn && (
                    <button
                      onClick={() => {
                        setEditingProfile(true)
                        setEditDisplayName(profile.display_name ?? '')
                        setEditUsername(profile.username ?? '')
                      }}
                      className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-fill transition-colors"
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
                {profile.username && <p className="text-xs text-ink-3">@{profile.username}</p>}
              </>
            )}

            {/* Stats */}
            <div className="flex gap-4 mt-2">
              <button onClick={() => setShowFollowers(true)} className="text-xs text-ink-3 hover:text-ink transition-colors">
                <span className="font-semibold text-ink">{followerCount}</span> Followers
              </button>
              <button onClick={() => setShowFollowing(true)} className="text-xs text-ink-3 hover:text-ink transition-colors">
                <span className="font-semibold text-ink">{followingCount}</span> Following
              </button>
            </div>
          </div>
        </div>

        {/* ── Follow / Block buttons (他人のプロフィール) ── */}
        {!isOwn && (
          <div className="flex gap-2 pt-2">
            {/* Follow — flex-1 で横幅を最大に */}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 ${
                isFollowing
                  ? 'border border-line text-ink-3 hover:bg-fill'
                  : 'bg-ink text-surface hover:bg-ink-2'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            {/* ... メニュー */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu((p) => !p)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-line text-ink-3 hover:text-ink hover:bg-fill transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal size={18} strokeWidth={2} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-line rounded-xl shadow-lg z-20 min-w-[130px] py-1 overflow-hidden">
                  <button
                    onClick={() => { handleBlock(); setShowMenu(false) }}
                    disabled={blockLoading}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-3 hover:bg-fill transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
        <div className="text-center py-14">
          <div className="text-4xl mb-3">🏔️</div>
          <p className="text-sm font-medium text-ink-2">Browse packing lists from other hikers</p>
          <p className="text-xs text-ink-3 mt-1">Public packs and trips will appear here</p>
        </div>
      )}

      {isOwn && (
        <div className="mt-12 pt-8 border-t border-line space-y-4">
          {/* Logout button */}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="w-full py-2 px-4 text-sm font-medium text-ink-3 hover:text-ink hover:bg-fill rounded-xl transition-colors border border-line"
          >
            Logout
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-ink-3 hover:text-red-500 transition-colors"
            >
              Delete account
            </button>
          ) : (
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              {/* タイトル・説明 — 赤なし */}
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-ink">Delete your account?</p>
                <p className="text-xs text-ink-3 leading-relaxed">
                  Your account and all data will be permanently deleted.<br />
                  This cannot be undone.
                </p>
              </div>

              {/* 確認入力 */}
              <div className="space-y-1.5">
                <label className="text-xs text-ink-3">
                  Type <span className="font-mono font-semibold text-ink">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-fill focus:outline-none focus:ring-2 focus:ring-ink font-mono placeholder:text-ink-3/40"
                />
              </div>

              {/* ボタン — Cancel が左・目立つ、Delete が右・控えめ赤 */}
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                  className="flex-1 py-2 bg-ink text-surface text-xs font-medium rounded-xl hover:bg-ink-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true)
                    const { data: { session } } = await supabase.auth.getSession()
                    const res = await fetch('/api/delete-account', {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${session?.access_token}` },
                    })
                    if (res.ok) {
                      await supabase.auth.signOut()
                      router.push('/')
                    } else {
                      alert('Failed to delete account.')
                      setDeleting(false)
                    }
                  }}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-2 border border-red-400 text-red-500 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showFollowers && (
        <FollowListModal
          title={`Followers · ${followerCount}`}
          userIds={followerIds}
          mutualIds={followerMutualIds}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <FollowListModal
          title={`Following · ${followingCount}`}
          userIds={followingIds}
          mutualIds={followingMutualIds}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  )
}
